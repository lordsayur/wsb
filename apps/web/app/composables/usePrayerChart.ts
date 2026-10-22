// specs/web/spec.md — trend view: reads a date range through the port and
// formats display-ready series. Core computes; the shell renders.
import { computed, ref, watch } from 'vue'
import {
  CHART_RANGES,
  isChartRange,
  DEFAULT_TIME_FORMAT,
  PRAYER_ORDER,
  bruneiNow,
  chartBounds,
  chartIsCurrent,
  chartMedian,
  formatChartPeriod,
  formatShortDate,
  formatTime,
  isChartOutlier,
  monthOf,
  rangeDates,
  shiftChartDate,
  type ChartRange,
  type District,
  type PrayerName,
  type TimeFormat,
} from '@wsb/core'
import { axisTicks, minuteAxis, sampleIndices } from '~/utils/chart'
import { getPrayerRepository } from './usePrayerTimes'
import { useDelayedFlag } from '~/utils/delayedFlag'

interface ChartDay {
  date: string
  label: string
  entries: Partial<Record<PrayerName, number>>
}

export interface ChartSeries {
  prayer: PrayerName
  label: string
  times: string[]
  values: (number | null)[]
}

export interface ChartPrayerOption {
  prayer: PrayerName
  label: string
}

export function usePrayerChart(
  district: () => District,
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
  active: () => boolean = () => true,
  t: (key: string) => string,
  initial: { range?: ChartRange | null; anchor?: string | null } = {},
) {
  const today = bruneiNow().date
  const range = ref<ChartRange>(initial.range ?? 'month')
  const anchor = ref(initial.anchor ?? today)
  const days = ref<ChartDay[]>([])
  const state = ref<'loading' | 'ready' | 'unavailable'>('loading')
  const stale = ref(false)
  const { flag: refreshing, start: startRefreshing, stop: stopRefreshing } =
    useDelayedFlag()
  const selected = ref<PrayerName[]>([])
  const hideOutliers = ref(false)
  let request = 0

  /** Synchronous cached view of a range, so the chart paints before revalidating. */
  function peekRange(
    anchorDate: string,
    rangeValue: ChartRange,
    districtValue: District,
    localeValue: string,
  ): { days: ChartDay[]; stale: boolean } | null {
    const repo = getPrayerRepository()
    if (!repo.peekMonth) return null
    const { start, end } = chartBounds(anchorDate, rangeValue)
    const dates = rangeDates(start, end)
    const months = [...new Set(dates.map(monthOf))]
    const found = new Map<string, Partial<Record<PrayerName, number>>>()
    let any = false
    let staleResult = false
    for (const month of months) {
      const result = repo.peekMonth(month, districtValue)
      if (!result || result.status !== 'ok') continue
      any = true
      staleResult ||= result.stale
      for (const day of result.days) {
        found.set(
          day.date,
          Object.fromEntries(day.entries.map((e) => [e.prayer, e.minutes])),
        )
      }
    }
    if (!any) return null
    return {
      days: dates.map((date) => ({
        date,
        label: formatShortDate(date, localeValue),
        entries: found.get(date) ?? {},
      })),
      stale: staleResult || dates.some((date) => !found.has(date)),
    }
  }

  const isCurrent = computed(() =>
    chartIsCurrent(anchor.value, range.value, today),
  )

  /** The period the chart is showing, so the controls name it. */
  const periodLabel = computed(() =>
    formatChartPeriod(anchor.value, range.value, locale()),
  )

  const prayerOptions = computed<ChartPrayerOption[]>(() =>
    PRAYER_ORDER.map((prayer) => ({ prayer, label: t(`prayer.${prayer}`) })),
  )

  const visiblePrayers = computed(() =>
    selected.value.length > 0 ? selected.value : [...PRAYER_ORDER],
  )

  const rawSeries = computed<ChartSeries[]>(() =>
    visiblePrayers.value.map((prayer) => {
      const values = days.value.map((day) => day.entries[prayer] ?? null)
      return {
        prayer,
        label: t(`prayer.${prayer}`),
        times: values.map((minutes) =>
          minutes === null ? '—' : formatTime(minutes, locale(), timeFormat()),
        ),
        values,
      }
    }),
  )

  /** Points far from their entry's median; a typo reads as a spike or drop. */
  const outliers = computed(() => {
    const found = new Set<string>()
    for (const line of rawSeries.value) {
      const median = chartMedian(line.values)
      if (median === null) continue
      line.values.forEach((value, index) => {
        if (value !== null && isChartOutlier(value, median)) {
          found.add(`${line.prayer}:${index}`)
        }
      })
    }
    return found
  })

  const hasOutliers = computed(() => outliers.value.size > 0)

  const outlierCount = computed(() => outliers.value.size)

  const series = computed<ChartSeries[]>(() =>
    rawSeries.value.map((line) => {
      if (!hideOutliers.value) return line
      const hidden = (index: number) =>
        outliers.value.has(`${line.prayer}:${index}`)
      return {
        ...line,
        values: line.values.map((value, index) =>
          hidden(index) ? null : value,
        ),
        times: line.times.map((text, index) => (hidden(index) ? '—' : text)),
      }
    }),
  )

  const rangeOptions = computed(() =>
    CHART_RANGES.map((value) => ({ value, label: t(`chart.range.${value}`) })),
  )

  const axis = computed(() =>
    minuteAxis(
      series.value.flatMap((item) =>
        item.values.filter((value): value is number => value !== null),
      ),
    ),
  )

  const yTicks = computed(() =>
    axisTicks(axis.value.min, axis.value.max, axis.value.step).map(
      (value) => ({ value, label: formatTime(value, locale(), timeFormat()) }),
    ),
  )

  const xTicks = computed(() =>
    sampleIndices(days.value.length, 6).map((index) => ({
      index,
      label: days.value[index]!.label,
    })),
  )

  async function load() {
    if (!active()) return
    const id = ++request
    const peek = peekRange(anchor.value, range.value, district(), locale())
    if (peek) {
      days.value = peek.days
      stale.value = peek.stale
      state.value = 'ready'
    } else if (state.value !== 'ready') {
      state.value = 'loading'
    }
    if (state.value === 'ready') startRefreshing()
    const { start, end } = chartBounds(anchor.value, range.value)
    const dates = rangeDates(start, end)
    const months = [...new Set(dates.map(monthOf))]
    const found = new Map<string, Partial<Record<PrayerName, number>>>()
    let staleResult = false
    try {
      const results = await Promise.all(
        months.map((month) => getPrayerRepository().readMonth(month, district())),
      )
      for (const result of results) {
        if (result.status === 'unavailable') continue
        staleResult ||= result.stale
        for (const day of result.days) {
          found.set(
            day.date,
            Object.fromEntries(day.entries.map((e) => [e.prayer, e.minutes])),
          )
        }
      }
    } catch {
      stopRefreshing()
      if (id === request && state.value !== 'ready') {
        state.value = 'unavailable'
        days.value = []
      }
      return
    }
    stopRefreshing()
    if (id !== request) return
    if (found.size === 0) {
      if (state.value !== 'ready') {
        state.value = 'unavailable'
        days.value = []
      }
      return
    }
    days.value = dates.map((date) => ({
      date,
      label: formatShortDate(date, locale()),
      entries: found.get(date) ?? {},
    }))
    stale.value = staleResult
    state.value = 'ready'
  }

  function setRange(next: string) {
    if (isChartRange(next)) range.value = next
  }

  function shift(delta: number) {
    anchor.value = shiftChartDate(anchor.value, range.value, delta)
  }

  function reset() {
    anchor.value = today
  }

  function togglePrayer(prayer: PrayerName) {
    if (selected.value.length === 0) {
      selected.value = [prayer]
      return
    }
    const next = selected.value.includes(prayer)
      ? selected.value.filter((item) => item !== prayer)
      : [...selected.value, prayer]
    selected.value =
      next.length === 0 || next.length === PRAYER_ORDER.length ? [] : next
  }

  function toggleOutliers() {
    hideOutliers.value = !hideOutliers.value
  }

  watch([range, anchor, district, locale, timeFormat, active], load, {
    immediate: true,
  })

  return {
    range,
    anchor,
    periodLabel,
    rangeOptions,
    isCurrent,
    prayerOptions,
    visiblePrayers,
    series,
    days,
    axis,
    yTicks,
    xTicks,
    state,
    refreshing,
    stale,
    hideOutliers,
    hasOutliers,
    outlierCount,
    setRange,
    shift,
    reset,
    togglePrayer,
    toggleOutliers,
    reload: load,
  }
}
