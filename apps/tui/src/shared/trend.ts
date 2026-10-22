// specs/tui/spec.md — trend view model. Mirrors the web chart: one overlapped
// line per entry on a shared minute-of-day axis, over a week, month or year.
// Pure model + braille plotting; no terminal I/O and no ANSI here.
import {
  PRAYER_ORDER,
  adjustForDistrict,
  chartBounds,
  formatMonth,
  formatShortDate,
  rangeDates,
  type ChartRange,
  type PrayerEntry,
  type PrayerName,
} from '@wsb/core'
import { t, type Locale } from './i18n.js'
import type { TuiSettings } from './settings.js'

export interface TrendSeries {
  prayer: PrayerName
  label: string
  /** Minutes since midnight, or null for a missing day. */
  values: (number | null)[]
}

export interface TrendView {
  range: ChartRange
  anchor: string
  title: string
  dates: string[]
  series: TrendSeries[]
  /** Rounded minute domain shared by every series. */
  min: number
  max: number
  step: number
  yTicks: number[]
  xTicks: { index: number; label: string }[]
  days: number
  stale: boolean
}

export interface TrendDayInput {
  date: string
  entries: readonly PrayerEntry[]
}

// The web chart's axis rounding, kept identical so both shells agree.
// ponytail: duplicated from the web shell's utils/chart.ts; promote to core if
// a third charting shell appears.
export function minuteAxis(values: readonly number[]): {
  min: number
  max: number
  step: number
} {
  if (values.length === 0) return { min: 0, max: 1440, step: 240 }
  const low = Math.min(...values)
  const high = Math.max(...values)
  const min = Math.max(0, Math.floor((low - 10) / 30) * 30)
  const max = Math.min(1440, Math.ceil((high + 10) / 30) * 30)
  const span = Math.max(max - min, 60)
  const step = span > 600 ? 120 : span > 240 ? 60 : 30
  return { min, max, step }
}

function axisTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  for (let value = min; value <= max; value += step) ticks.push(value)
  return ticks
}

/** At most `count` evenly spaced indices, always including both ends. */
export function sampleIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, index) => index)
  const indices = new Set<number>()
  for (let i = 0; i < count; i += 1) {
    indices.add(Math.round((i * (length - 1)) / (count - 1)))
  }
  return [...indices].sort((a, b) => a - b)
}

/** The chart title for a range: month name, year, or a week span. */
function titleFor(
  anchor: string,
  range: ChartRange,
  locale: Locale,
): string {
  if (range === 'year') return anchor.slice(0, 4)
  if (range === 'month') return formatMonth(anchor.slice(0, 7), locale)
  const { start, end } = chartBounds(anchor, range)
  return `${formatShortDate(start, locale)} – ${formatShortDate(end, locale)}`
}

export function buildTrendView(
  days: readonly TrendDayInput[],
  settings: TuiSettings,
  range: ChartRange,
  anchor: string,
): TrendView {
  const locale: Locale = settings.locale
  const adjusted = days.map((day) => ({
    date: day.date,
    entries: adjustForDistrict(day.entries, settings.district),
  }))

  const series: TrendSeries[] = PRAYER_ORDER.map((prayer) => ({
    prayer,
    label: t(locale, `prayer.${prayer}`),
    values: adjusted.map((day) => {
      const entry = day.entries.find((item) => item.prayer === prayer)
      return entry ? entry.minutes : null
    }),
  }))

  const values = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  )
  const axis = minuteAxis(values)

  const dates = adjusted.map((day) => day.date)
  const xTicks = sampleIndices(dates.length, 6).map((index) => ({
    index,
    label: formatShortDate(dates[index]!, locale),
  }))

  return {
    range,
    anchor,
    title: titleFor(anchor, range, locale),
    dates,
    series,
    min: axis.min,
    max: axis.max,
    step: axis.step,
    yTicks: axisTicks(axis.min, axis.max, axis.step),
    xTicks,
    days: dates.length,
    stale: false,
  }
}

/** One terminal cell of the plot: braille dots plus the entry that drew last. */
export interface PlotCell {
  bits: number
  prayer: PrayerName | null
}

const BRAILLE_BASE = 0x2800
const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const

/** Renders the series into a braille dot grid, `height` rows by `width` cells. */
export function plotTrend(
  view: TrendView,
  width: number,
  height: number,
): PlotCell[][] {
  const cells: PlotCell[][] = Array.from({ length: Math.max(0, height) }, () =>
    Array.from({ length: Math.max(0, width) }, () => ({ bits: 0, prayer: null })),
  )
  if (width <= 0 || height <= 0 || view.dates.length === 0) return cells

  const dotW = width * 2
  const dotH = height * 4
  const span = Math.max(1, view.max - view.min)
  const count = view.dates.length
  const xAt = (index: number) =>
    count <= 1 ? (dotW - 1) / 2 : (index / (count - 1)) * (dotW - 1)
  const yAt = (minutes: number) =>
    (1 - (minutes - view.min) / span) * (dotH - 1)

  const plot = (prayer: PrayerName, x: number, y: number) => {
    const cx = Math.round(x)
    const cy = Math.round(y)
    if (cx < 0 || cy < 0 || cx >= dotW || cy >= dotH) return
    const cell = cells[Math.floor(cy / 4)]![Math.floor(cx / 2)]!
    cell.bits |= DOT_BITS[cy % 4]![cx % 2]!
    cell.prayer = prayer
  }

  for (const line of view.series) {
    let previous: { x: number; y: number } | null = null
    line.values.forEach((value, index) => {
      if (value === null) {
        previous = null
        return
      }
      const point = { x: xAt(index), y: yAt(value) }
      if (!previous) {
        plot(line.prayer, point.x, point.y)
      } else {
        const steps = Math.max(
          1,
          Math.ceil(
            Math.max(
              Math.abs(point.x - previous.x),
              Math.abs(point.y - previous.y),
            ),
          ),
        )
        for (let step = 1; step <= steps; step += 1) {
          plot(
            line.prayer,
            previous.x + ((point.x - previous.x) * step) / steps,
            previous.y + ((point.y - previous.y) * step) / steps,
          )
        }
      }
      previous = point
    })
  }
  return cells
}

/** The braille character for a cell, or a space when it has no dots. */
export function braille(cell: PlotCell): string {
  return cell.bits === 0 ? ' ' : String.fromCodePoint(BRAILLE_BASE + cell.bits)
}

/** Dates covered by a range anchor, for the loader. */
export function trendDates(anchor: string, range: ChartRange): string[] {
  const { start, end } = chartBounds(anchor, range)
  return rangeDates(start, end)
}
