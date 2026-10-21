// specs/web/spec.md — shell wiring. No business logic: core computes, the shell renders.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  PRAYER_ORDER,
  bruneiNow,
  DEFAULT_TIME_FORMAT,
  createPrayerTimes,
  formatDate,
  formatHijriDate,
  formatTime,
  prayerProgress,
  resolveDistrict,
  type District,
  type PrayerName,
  type TimeFormat,
} from '@wsb/core'
import {
  CachedPrayerRepository,
  type PrayerRepository,
  type RemotePrayerSource,
} from '@wsb/data'
import { LocalPrayerCacheStore, LocalSelectionStore } from '@wsb/data/local'
import { SupabasePrayerSource } from '@wsb/data/supabase'
import { useDelayedFlag } from '~/utils/delayedFlag'

let repository: PrayerRepository | null = null

// specs/data/spec.md — Supabase is the only runtime source; device cache first.
// MORA is import-time only (monthly, manual).
function getSource(): RemotePrayerSource {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const anonKey = config.public.supabaseAnonKey
  if (!url || !anonKey) {
    return {
      async fetchPrayerEntries() {
        throw new Error('Supabase is not configured')
      },
    }
  }
  return new SupabasePrayerSource({ url, anonKey })
}

export function getPrayerRepository(): PrayerRepository {
  if (!repository) {
    const storage =
      typeof window === 'undefined' ? undefined : window.localStorage
    repository = new CachedPrayerRepository({
      source: getSource(),
      cache: storage ? new LocalPrayerCacheStore(storage) : undefined,
      selection: storage ? new LocalSelectionStore(storage) : undefined,
    })
  }
  return repository
}

function today(): string {
  // Brunei calendar date (UTC+8), regardless of the browser's timezone.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Brunei',
  }).format(new Date())
}

export type LoadState = 'loading' | 'ready' | 'unavailable'

/**
 * Read-only district for pages that only need the selection (the trend chart),
 * without loading the day's times.
 */
export function useDistrict(initialDistrict: District | null = null) {
  const repo = getPrayerRepository()
  const district = ref<District>(
    resolveDistrict(initialDistrict ?? repo.getSelectionSync?.() ?? null),
  )
  onMounted(async () => {
    if (initialDistrict) {
      await repo.setSelection(initialDistrict)
      return
    }
    district.value = resolveDistrict(await repo.getSelection())
  })
  return { district }
}

export function usePrayerTimes(
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
  initialDistrict: District | null = null,
) {
  const repo = getPrayerRepository()
  // Keep the initial values identical to SSR; cached data is painted in
  // onMounted before revalidating, so hydration never mismatches.
  const state = ref<LoadState>('loading')
  const stored = initialDistrict ?? repo.getSelectionSync?.() ?? null
  const district = ref<District>(resolveDistrict(stored))
  const { flag: refreshing, start: startRefreshing, stop: stopRefreshing } =
    useDelayedFlag()
  const entries = ref<{ prayer: PrayerName; minutes: number }[]>([])
  const baseEntries = ref<{ prayer: PrayerName; minutes: number }[]>([])
  const stale = ref(false)
  const date = ref(today())
  const hijriDate = ref('')
  const nowSeconds = ref(bruneiNow().seconds)
  let clock: ReturnType<typeof setInterval> | undefined

  function apply(next: { prayer: PrayerName; minutes: number }[], hijri: string) {
    date.value = today()
    baseEntries.value = next
    entries.value = createPrayerTimes(date.value, district.value, next).entries
    hijriDate.value = hijri
  }

  /** specs/web/spec.md — paint the cached day before any network work. */
  function paintFromCache(): boolean {
    if (stored) district.value = resolveDistrict(stored)
    const cached = repo.peek?.(today(), district.value)
    if (cached?.status !== 'ok') return false
    apply(cached.entries, cached.hijriDate)
    stale.value = cached.stale
    state.value = 'ready'
    return true
  }

  onMounted(() => {
    clock = setInterval(() => {
      nowSeconds.value = bruneiNow().seconds
    }, 1_000)
  })
  onUnmounted(() => clearInterval(clock))

  // Client-only: fill from the cache during setup so the first render already
  // has times instead of flashing a loading state. SSR markup stays the shell.
  if (import.meta.client) paintFromCache()

  async function load() {
    if (initialDistrict) {
      // A link names the district; keep it as the saved choice too.
      await repo.setSelection(initialDistrict)
    } else if (!stored) {
      district.value = resolveDistrict(await repo.getSelection())
    }

    if (paintFromCache()) {
      // Cached times stay on screen; revalidate quietly against the source and
      // only show a small inline hint. A failed revalidation keeps the cache.
      startRefreshing()
      await repo.refresh(today(), district.value)
      const fresh = repo.peek?.(today(), district.value)
      if (fresh?.status === 'ok') {
        apply(fresh.entries, fresh.hijriDate)
        stale.value = fresh.stale
      }
      stopRefreshing()
      return
    }

    state.value = 'loading'
    entries.value = []
    baseEntries.value = []
    stale.value = false
    stopRefreshing()
    const result = await repo.read(today(), district.value)
    if (result.status === 'unavailable') {
      state.value = 'unavailable'
      return
    }
    apply(result.entries, result.hijriDate)
    stale.value = result.stale
    state.value = 'ready'
  }

  async function selectDistrict(next: string) {
    // A different district has different times; don't keep the old ones on
    // screen while the new selection loads. Cached times (if any) paint again.
    district.value = resolveDistrict(next)
    state.value = 'loading'
    entries.value = []
    baseEntries.value = []
    stale.value = false
    await repo.setSelection(district.value)
    await load()
  }

  async function reloadData() {
    // `load` revalidates against the source; no separate refresh needed.
    await load()
  }

  const rows = computed(() =>
    PRAYER_ORDER.map((prayer) => ({
      prayer,
      minutes: entries.value.find((entry) => entry.prayer === prayer)?.minutes,
    })),
  )

  const progress = computed(() => prayerProgress(entries.value, nowSeconds.value))

  const displayDates = computed(() => ({
    masihi: formatDate(date.value, locale()),
    hijri: formatHijriDate(date.value, locale(), hijriDate.value),
  }))

  // specs/web/spec.md — the eight rows are always on screen; a missing entry
  // renders an empty time so the sheet can show a placeholder instead.
  const displayRows = computed(() =>
    rows.value.map((row) => ({
      ...row,
      time:
        row.minutes === undefined
          ? ''
          : formatTime(row.minutes, locale(), timeFormat()),
      current: row.prayer === progress.value.current,
    })),
  )

  return {
    state,
    refreshing,
    district,
    entries,
    rows: displayRows,
    baseEntries,
    date,
    dates: displayDates,
    progress,
    stale,
    load,
    paintFromCache,
    reloadData,
    selectDistrict,
  }
}
