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

function getRepository(): PrayerRepository {
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

export function usePrayerTimes(
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
) {
  const repo = getRepository()
  const state = ref<LoadState>('loading')
  const district = ref<District>(resolveDistrict(null))
  const entries = ref<{ prayer: PrayerName; minutes: number }[]>([])
  const baseEntries = ref<{ prayer: PrayerName; minutes: number }[]>([])
  const stale = ref(false)
  const date = ref(today())
  const hijriDate = ref('')
  const nowSeconds = ref(bruneiNow().seconds)
  let clock: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    clock = setInterval(() => {
      nowSeconds.value = bruneiNow().seconds
    }, 1_000)
  })
  onUnmounted(() => clearInterval(clock))

  async function load() {
    state.value = 'loading'
    const selection = await repo.getSelection()
    district.value = resolveDistrict(selection)
    const result = await repo.read(today(), district.value)
    if (result.status === 'unavailable') {
      state.value = 'unavailable'
      return
    }
    date.value = today()
    baseEntries.value = result.entries
    entries.value = createPrayerTimes(
      date.value,
      district.value,
      result.entries,
    ).entries
    hijriDate.value = result.hijriDate
    stale.value = result.stale
    state.value = 'ready'
  }

  async function selectDistrict(next: string) {
    district.value = resolveDistrict(next)
    await repo.setSelection(district.value)
    await load()
  }

  async function reloadData() {
    await repo.refresh(today(), district.value)
    await load()
  }

  const rows = computed(() =>
    PRAYER_ORDER.filter((prayer) =>
      entries.value.some((entry) => entry.prayer === prayer),
    ).map((prayer) => ({
      prayer,
      minutes: entries.value.find((entry) => entry.prayer === prayer)!.minutes,
    })),
  )

  const progress = computed(() => prayerProgress(entries.value, nowSeconds.value))

  const displayDates = computed(() => ({
    masihi: formatDate(date.value, locale()),
    hijri: formatHijriDate(date.value, locale(), hijriDate.value),
  }))

  const displayRows = computed(() =>
    rows.value.map((row) => ({
      ...row,
      time: formatTime(row.minutes, locale(), timeFormat()),
      current: row.prayer === progress.value.current,
    })),
  )

  return {
    state,
    district,
    entries,
    rows: displayRows,
    baseEntries,
    date,
    dates: displayDates,
    progress,
    stale,
    load,
    reloadData,
    selectDistrict,
  }
}
