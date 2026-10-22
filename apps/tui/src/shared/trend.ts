// specs/tui/spec.md — trend view model. One sparkline row per entry, scaled to
// that entry's own min/max so a few minutes of drift stay visible; the bounds
// are printed beside the row so the scale is never a guess.
import {
  PRAYER_ORDER,
  adjustForDistrict,
  formatMonth,
  formatTime,
  type PrayerEntry,
  type PrayerName,
  type TimeFormat,
  DEFAULT_TIME_FORMAT,
} from '@wsb/core'
import { t, type Locale } from './i18n.js'
import type { TuiSettings } from './settings.js'

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export interface TrendRowView {
  prayer: PrayerName
  label: string
  values: (number | null)[]
  low: string
  high: string
  spark: string
  color: string
}

export interface TrendView {
  month: string
  title: string
  days: number
  rows: TrendRowView[]
  stale: boolean
}

/** Downsamples to `width` buckets, keeping the first and last value. */
export function sample(values: readonly (number | null)[], width: number): (number | null)[] {
  if (width <= 0) return []
  if (values.length <= width) return [...values]
  return Array.from({ length: width }, (_, index) => {
    const start = Math.floor((index * values.length) / width)
    const end = Math.max(start + 1, Math.floor(((index + 1) * values.length) / width))
    const bucket = values.slice(start, end).filter((value): value is number => value !== null)
    if (bucket.length === 0) return null
    return bucket[Math.floor(bucket.length / 2)]!
  })
}

/** A sparkline over an explicit domain, so rows stay comparable. */
export function sparkline(values: readonly (number | null)[], width: number): string {
  const sampled = sample(values, width)
  const numbers = sampled.filter((value): value is number => value !== null)
  if (numbers.length === 0) return ''
  const low = Math.min(...numbers)
  const high = Math.max(...numbers)
  return sampled
    .map((value) => {
      if (value === null) return ' '
      if (high === low) return BLOCKS[3]!
      const level = Math.round(((value - low) / (high - low)) * (BLOCKS.length - 1))
      return BLOCKS[level]!
    })
    .join('')
}

export interface TrendDayInput {
  date: string
  entries: readonly PrayerEntry[]
}

export function buildTrendView(
  days: readonly TrendDayInput[],
  month: string,
  settings: TuiSettings,
  width = 40,
): TrendView {
  const locale: Locale = settings.locale
  const format: TimeFormat = settings.timeFormat ?? DEFAULT_TIME_FORMAT
  const adjusted = days.map((day) => ({
    date: day.date,
    entries: adjustForDistrict(day.entries, settings.district),
  }))
  const rows = PRAYER_ORDER.map((prayer) => {
    const values = adjusted.map((day) => {
      const entry = day.entries.find((item) => item.prayer === prayer)
      return entry ? entry.minutes : null
    })
    const numbers = values.filter((value): value is number => value !== null)
    return {
      prayer,
      label: t(locale, `prayer.${prayer}`),
      values,
      low: numbers.length ? formatTime(Math.min(...numbers), locale, format) : '—',
      high: numbers.length ? formatTime(Math.max(...numbers), locale, format) : '—',
      spark: sparkline(values, width),
      color: prayer,
    }
  })
  return {
    month,
    title: formatMonth(month, locale),
    days: days.length,
    rows,
    stale: false,
  }
}
