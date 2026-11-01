// specs/web/spec.md — shell wiring. No business logic: core computes, the shell renders.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  bruneiNow,
  DEFAULT_TIME_FORMAT,
  createPrayerTimes,
  displayPrayers,
  formatDate,
  formatHijriDate,
  formatTime,
  passedPrayer,
  prayerProgress,
  prayerPhase,
  resolveDistrict,
  shiftDate,
  type District,
  type PrayerEntry,
  type TimeFormat,
} from '@wsb/core'
import {
  CachedPrayerRepository,
  type PrayerRepository,
  type RemotePrayerSource,
} from '@wsb/data'
import { LocalPrayerCacheStore, LocalSelectionStore } from '@wsb/data/local'
import { SupabasePrayerSource } from '@wsb/data/supabase'
import { nextLoadDistrict } from '~/utils/districtLoad'
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
  // A link's district is only the starting point; once the user picks another
  // it must not snap back, so it is consumed exactly once (see districtLoad).
  let linkedDistrict = initialDistrict
  const stored = initialDistrict ?? repo.getSelectionSync?.() ?? null
  const district = ref<District>(resolveDistrict(stored))
  const { flag: refreshing, start: startRefreshing, stop: stopRefreshing } =
    useDelayedFlag()
  const entries = ref<PrayerEntry[]>([])
  const baseEntries = ref<PrayerEntry[]>([])
  const tomorrowEntries = ref<PrayerEntry[]>([])
  const tomorrowHijriDate = ref('')
  const stale = ref(false)
  const date = ref(today())
  const hijriDate = ref('')
  const nowSeconds = ref(bruneiNow().seconds)
  let clock: ReturnType<typeof setInterval> | undefined

  function apply(
    next: PrayerEntry[],
    hijri: string,
    tomorrow: PrayerEntry[] = [],
    tomorrowHijri = '',
  ) {
    date.value = today()
    baseEntries.value = next
    entries.value = createPrayerTimes(date.value, district.value, next).entries
    hijriDate.value = hijri
    tomorrowEntries.value = createPrayerTimes(
      shiftDate(date.value, 1),
      district.value,
      tomorrow,
    ).entries
    tomorrowHijriDate.value = tomorrowHijri
  }

  /** specs/web/spec.md — paint the cached day before any network work. */
  function paintFromCache(): boolean {
    const cached = repo.peek?.(today(), district.value)
    if (cached?.status !== 'ok') return false
    // A peek for tomorrow only counts when it is that day, not last-known data.
    const tomorrow = repo.peek?.(shiftDate(today(), 1), district.value)
    const next = tomorrow?.status === 'ok' && !tomorrow.stale ? tomorrow : null
    apply(
      cached.entries,
      cached.hijriDate,
      next?.entries ?? [],
      next?.hijriDate ?? '',
    )
    stale.value = cached.stale
    state.value = 'ready'
    return true
  }

  onMounted(() => {
    clock = setInterval(() => {
      const now = bruneiNow()
      nowSeconds.value = now.seconds
      // The day, its entries and its dates are resolved once; when Brunei
      // midnight passes, reload so the sheet shows the new day, not yesterday's.
      if (now.date !== date.value) void load()
    }, 1_000)
  })
  onUnmounted(() => clearInterval(clock))

  // Client-only: fill from the cache during setup so the first render already
  // has times instead of flashing a loading state. SSR markup stays the shell.
  if (import.meta.client) paintFromCache()

  async function load() {
    const hadLink = linkedDistrict !== null
    const choice = nextLoadDistrict(
      linkedDistrict,
      stored,
      district.value,
      stored ? null : await repo.getSelection(),
    )
    linkedDistrict = choice.linked
    if (hadLink || choice.district !== district.value) {
      district.value = choice.district
      await repo.setSelection(choice.district)
    }

    if (paintFromCache()) {
      // Cached times stay on screen; revalidate quietly against the source and
      // only show a small inline hint. A failed revalidation keeps the cache.
      startRefreshing()
      await Promise.all([
        repo.refresh(today(), district.value),
        repo.refresh(shiftDate(today(), 1), district.value),
      ])
      const fresh = repo.peek?.(today(), district.value)
      if (fresh?.status === 'ok') {
        const tomorrow = repo.peek?.(shiftDate(today(), 1), district.value)
        const next =
          tomorrow?.status === 'ok' && !tomorrow.stale ? tomorrow : null
        apply(
          fresh.entries,
          fresh.hijriDate,
          next?.entries ?? tomorrowEntries.value,
          next?.hijriDate ?? tomorrowHijriDate.value,
        )
        stale.value = fresh.stale
      }
      stopRefreshing()
      return
    }

    state.value = 'loading'
    entries.value = []
    baseEntries.value = []
    tomorrowEntries.value = []
    stale.value = false
    stopRefreshing()
    // Tomorrow is read alongside today so the evening list can show its early
    // entries; a failed tomorrow read only hides those two rows.
    const [result, tomorrow] = await Promise.all([
      repo.read(today(), district.value),
      repo.read(shiftDate(today(), 1), district.value),
    ])
    if (result.status === 'unavailable') {
      state.value = 'unavailable'
      return
    }
    // A failed read returns the last known day marked stale; never present it
    // as tomorrow's times or as tomorrow's Hijri date.
    const next = tomorrow.status === 'ok' && !tomorrow.stale ? tomorrow : null
    apply(
      result.entries,
      result.hijriDate,
      next?.entries ?? [],
      next?.hijriDate ?? '',
    )
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
    tomorrowEntries.value = []
    stale.value = false
    await repo.setSelection(district.value)
    await load()
  }

  async function reloadData() {
    // `load` revalidates against the source; no separate refresh needed.
    await load()
  }

  // specs/core/spec.md — the list keeps every entry until the end of Zuhur;
  // from Asar it drops the morning boundaries and appends tomorrow's Imsak and
  // Subuh at the bottom.
  const shown = computed(() =>
    displayPrayers(entries.value, tomorrowEntries.value, nowSeconds.value),
  )

  const rows = computed(() => shown.value.entries)

  const progress = computed(() => prayerProgress(entries.value, nowSeconds.value))

  // Just after an entry, show how long ago it passed instead of the countdown
  // to the next one; core decides when (and never for Imsak).
  const passed = computed(() => passedPrayer(entries.value, nowSeconds.value))

  const displayDates = computed(() => {
    const nextDay = shiftDate(date.value, 1)
    const hijri =
      prayerPhase(entries.value, nowSeconds.value) === 'night'
        ? formatHijriDate(nextDay, locale(), tomorrowHijriDate.value)
        : formatHijriDate(date.value, locale(), hijriDate.value)
    return { masihi: formatDate(date.value, locale()), hijri }
  })

  // A missing entry renders an empty time so the sheet can show a placeholder.
  const displayRows = computed(() =>
    rows.value.map((row) => ({
      prayer: row.prayer,
      minutes: row.minutes,
      dayOffset: row.dayOffset,
      trailing: row.trailing,
      time:
        row.minutes === null
          ? ''
          : formatTime(row.minutes, locale(), timeFormat()),
      current: row.dayOffset === 0 && row.prayer === progress.value.current,
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
    passed,
    stale,
    load,
    paintFromCache,
    reloadData,
    selectDistrict,
  }
}
