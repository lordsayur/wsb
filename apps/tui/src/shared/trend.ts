// specs/tui/spec.md — trend view model. Mirrors the web chart: one overlapped
// line per entry on a shared minute-of-day axis, over a week, month or year.
// Pure model + line plotting; no terminal I/O and no ANSI here.
import {
  PRAYER_ORDER,
  adjustForDistrict,
  chartBounds,
  formatChartPeriod,
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
    title: formatChartPeriod(anchor, range, locale),
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

/** One terminal cell of the plot: a line glyph plus the series that drew it. */
export interface PlotCell {
  glyph: string
  prayer: PrayerName | null
}

// Line glyphs, not blocks: a filled cell would read as a bar chart. Crossing
// glyphs appear where two entries pass through the same cell.
const HORIZONTAL = '─'
const VERTICAL = '│'
const UP = '╱'
const DOWN = '╲'

/** Merges two glyphs that land on the same cell. */
function merge(existing: string, incoming: string): string {
  if (existing === ' ') return incoming
  if (existing === incoming) return existing
  const orthogonal =
    (existing === HORIZONTAL && incoming === VERTICAL) ||
    (existing === VERTICAL && incoming === HORIZONTAL)
  if (orthogonal) return '┼'
  if (
    (existing === UP && incoming === DOWN) ||
    (existing === DOWN && incoming === UP)
  ) {
    return '╳'
  }
  return existing
}

/** The glyph for one Bresenham step, oriented by the direction of travel. */
function stepGlyph(dx: number, dy: number): string {
  if (dy === 0) return HORIZONTAL
  if (dx === 0) return VERTICAL
  return dx * dy < 0 ? UP : DOWN
}

/** Walks a straight line in cell coordinates, yielding each cell it crosses. */
function traceLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  visit: (x: number, y: number, glyph: string) => void,
): void {
  let x = x0
  let y = y0
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let error = dx - dy

  for (;;) {
    // The glyph is the direction of the step leaving this cell.
    const stepX = x === x1 ? 0 : sx
    const stepY = y === y1 ? 0 : sy
    visit(x, y, stepGlyph(stepX, stepY))
    if (x === x1 && y === y1) break
    const doubled = error * 2
    if (doubled > -dy) {
      error -= dy
      x += sx
    }
    if (doubled < dx) {
      error += dx
      y += sy
    }
  }
}

/** Renders the series into a `height` x `width` cell grid of line glyphs. */
export function plotTrend(
  view: TrendView,
  width: number,
  height: number,
): PlotCell[][] {
  const cells: PlotCell[][] = Array.from({ length: Math.max(0, height) }, () =>
    Array.from({ length: Math.max(0, width) }, () => ({ glyph: ' ', prayer: null })),
  )
  if (width <= 0 || height <= 0 || view.dates.length === 0) return cells

  const span = Math.max(1, view.max - view.min)
  const count = view.dates.length
  const xAt = (index: number) =>
    count <= 1 ? (width - 1) / 2 : (index / (count - 1)) * (width - 1)
  const yAt = (minutes: number) =>
    (1 - (minutes - view.min) / span) * (height - 1)

  const paint = (prayer: PrayerName, x: number, y: number, glyph: string) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const cell = cells[y]![x]!
    cell.glyph = merge(cell.glyph, glyph)
    cell.prayer = prayer
  }

  for (const line of view.series) {
    let previous: { x: number; y: number } | null = null
    line.values.forEach((value, index) => {
      if (value === null) {
        previous = null
        return
      }
      const point = {
        x: Math.round(xAt(index)),
        y: Math.round(yAt(value)),
      }
      if (previous) {
        traceLine(previous.x, previous.y, point.x, point.y, (x, y, glyph) =>
          paint(line.prayer, x, y, glyph),
        )
      } else {
        paint(line.prayer, point.x, point.y, HORIZONTAL)
      }
      previous = point
    })
  }
  return cells
}

/** Dates covered by a range anchor, for the loader. */
export function trendDates(anchor: string, range: ChartRange): string[] {
  const { start, end } = chartBounds(anchor, range)
  return rangeDates(start, end)
}
