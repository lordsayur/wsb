// specs/web/spec.md — the weekly slide: a Monday-first week read through the
// Data port, transposed (prayers down, days across). Core computes the dates,
// the current period and the current entry; the shell only renders.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  DEFAULT_TIME_FORMAT,
  PRAYER_ORDER,
  adjustForDistrict,
  bruneiNow,
  chartBounds,
  chartIsCurrent,
  formatChartPeriod,
  formatDayNumber,
  formatTime,
  formatWeekday,
  monthOf,
  prayerProgress,
  rangeDates,
  shiftChartDate,
  type District,
  type PrayerEntry,
  type PrayerName,
  type TimeFormat,
} from '@wsb/core'
import { getPrayerRepository } from './usePrayerTimes'
import { useDelayedFlag } from '~/utils/delayedFlag'

export interface WeekColumn {
  date: string
  day: string
  weekday: string
  today: boolean
}

export interface WeekCell {
  text: string
  current: boolean
}

export interface WeekRow {
  prayer: string
  label: string
  cells: WeekCell[]
}

interface LoadedDay {
  date: string
  entries: PrayerEntry[]
}

/** How often the slide re-reads the Brunei clock for today/highlights. */
const CLOCK_TICK_MS = 30_000

export function usePrayerWeek(
  district: () => District,
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
  /** Today's date, from the deck, so both slides roll over together. */
  deckDate: () => string = () => bruneiNow().date,
) {
  const { t } = useI18n()
  const anchor = ref(deckDate())
  const days = ref<LoadedDay[]>([])
  const state = ref<'loading' | 'ready' | 'unavailable'>('loading')
  const stale = ref(false)
  const { flag: refreshing, start: startRefreshing, stop: stopRefreshing } =
    useDelayedFlag()

  // A ticking clock keeps the "today" column and the current cell honest when
  // the slide stays open across midnight.
  const tick = ref(0)
  const clock = setInterval(() => {
    tick.value += 1
  }, CLOCK_TICK_MS)
  onBeforeUnmount(() => clearInterval(clock))

  const today = computed(() => {
    void tick.value
    return deckDate()
  })
  const nowSeconds = computed(() => {
    void tick.value
    return bruneiNow().seconds
  })

  const bounds = computed(() => chartBounds(anchor.value, 'week'))
  const title = computed(() => formatChartPeriod(anchor.value, 'week', locale()))
  const current = computed(() =>
    chartIsCurrent(anchor.value, 'week', today.value),
  )

  const dates = computed(() => rangeDates(bounds.value.start, bounds.value.end))

  // Adjusted entries and formatted times change with district/locale/format
  // only, so build them once per day instead of once per cell.
  const rendered = computed(() => {
    const byDate = new Map<string, Partial<Record<PrayerName, string>>>()
    for (const day of days.value) {
      const entries = adjustForDistrict(day.entries, district())
      byDate.set(
        day.date,
        Object.fromEntries(
          entries.map((entry) => [
            entry.prayer,
            formatTime(entry.minutes, locale(), timeFormat()),
          ]),
        ),
      )
    }
    return byDate
  })

  const columns = computed<WeekColumn[]>(() =>
    dates.value.map((date) => ({
      date,
      day: formatDayNumber(date, locale()),
      weekday: formatWeekday(date, locale(), 'short'),
      today: date === today.value,
    })),
  )

  /** The entry running now, resolved by core so both slides agree. */
  const currentPrayer = computed(() => {
    const day = days.value.find((item) => item.date === today.value)
    if (!day) return null
    const entries = adjustForDistrict(day.entries, district())
    return prayerProgress(entries, nowSeconds.value).current
  })

  const rows = computed<WeekRow[]>(() =>
    PRAYER_ORDER.map((prayer) => ({
      prayer,
      label: t(`prayer.${prayer}`),
      cells: dates.value.map((date) => ({
        text: rendered.value.get(date)?.[prayer] ?? '—',
        current: date === today.value && prayer === currentPrayer.value,
      })),
    })),
  )

  function paintFromCache(): boolean {
    const repo = getPrayerRepository()
    if (!repo.peekMonth) return false
    const months = [...new Set(dates.value.map(monthOf))]
    const loaded: LoadedDay[] = []
    let any = false
    let anyStale = false
    for (const month of months) {
      const result = repo.peekMonth(month, district())
      if (result?.status !== 'ok') continue
      any = true
      anyStale ||= result.stale
      for (const day of result.days) loaded.push(day)
    }
    if (!any) return false
    days.value = loaded
    // Same rule as the network path, so cache and revalidate agree.
    stale.value =
      anyStale || dates.value.some((date) => !loaded.some((d) => d.date === date))
    state.value = 'ready'
    return true
  }

  // Monotonic guard: a slow earlier week must never overwrite a newer one.
  let request = 0

  async function load() {
    // specs/web/spec.md — the slide is client-rendered (it lives inside
    // ClientOnly), so the cached week paints first and then revalidates.
    if (!paintFromCache()) {
      state.value = 'loading'
      days.value = []
      stale.value = false
    }
    if (state.value === 'ready') startRefreshing()

    const id = ++request
    const repo = getPrayerRepository()
    const months = [...new Set(dates.value.map(monthOf))]
    const loaded: LoadedDay[] = []
    let any = false
    let anyStale = false
    for (const month of months) {
      const result = await repo.readMonth(month, district())
      if (id !== request) return
      if (result.status !== 'ok') continue
      any = true
      anyStale ||= result.stale
      for (const day of result.days) loaded.push(day)
    }
    stopRefreshing()
    if (id !== request) return
    if (!any) {
      if (state.value !== 'ready') {
        state.value = 'unavailable'
        days.value = []
      }
      return
    }
    days.value = loaded
    // A week that spans two months is stale while any day is missing.
    stale.value =
      anyStale || dates.value.some((date) => !loaded.some((d) => d.date === date))
    state.value = 'ready'
  }

  function shift(delta: number) {
    anchor.value = shiftChartDate(anchor.value, 'week', delta)
  }

  function reset() {
    anchor.value = today.value
  }

  watch([anchor, district], load, { immediate: true })

  // Stepping back to "now" when the deck date rolls past midnight keeps the
  // open slide on the current week rather than yesterday's.
  watch(today, (next, previous) => {
    if (anchor.value === previous) anchor.value = next
  })

  return {
    title,
    current,
    columns,
    rows,
    state,
    stale,
    refreshing,
    shift,
    reset,
  }
}
