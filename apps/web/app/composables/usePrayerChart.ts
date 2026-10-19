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
  formatShortDate,
  formatTime,
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
) {
  const today = bruneiNow().date
  const range = ref<ChartRange>('month')
  const anchor = ref(today)
  const days = ref<ChartDay[]>([])
  const state = ref<'loading' | 'ready' | 'unavailable'>('loading')
  const stale = ref(false)
  const selected = ref<PrayerName[]>([])
  let request = 0

  const isCurrent = computed(() =>
    chartIsCurrent(anchor.value, range.value, today),
  )

  const prayerOptions = computed<ChartPrayerOption[]>(() =>
    PRAYER_ORDER.map((prayer) => ({ prayer, label: t(`prayer.${prayer}`) })),
  )

  const visiblePrayers = computed(() =>
    selected.value.length > 0 ? selected.value : [...PRAYER_ORDER],
  )

  const series = computed<ChartSeries[]>(() =>
    visiblePrayers.value.map((prayer) => ({
      prayer,
      label: t(`prayer.${prayer}`),
      times: days.value.map((day) => {
        const minutes = day.entries[prayer]
        return minutes === undefined
          ? '—'
          : formatTime(minutes, locale(), timeFormat())
      }),
      values: days.value.map((day) => day.entries[prayer] ?? null),
    })),
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
    state.value = 'loading'
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
      if (id === request) {
        state.value = 'unavailable'
        days.value = []
      }
      return
    }
    if (id !== request) return
    if (found.size === 0) {
      state.value = 'unavailable'
      days.value = []
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

  watch([range, anchor, district, locale, timeFormat, active], load, {
    immediate: true,
  })

  return {
    range,
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
    stale,
    setRange,
    shift,
    reset,
    togglePrayer,
    reload: load,
  }
}
