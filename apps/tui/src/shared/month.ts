// specs/tui/spec.md — monthly view model. Formats one month of entries for the
// table; core owns the offsets and the time formatting.
import {
  DEFAULT_TIME_FORMAT,
  PRAYER_ORDER,
  adjustForDistrict,
  formatDayNumber,
  formatMonth,
  formatTime,
  formatWeekday,
  monthOf,
  prayerProgress,
  type District,
  type PrayerEntry,
  type PrayerName,
  type TimeFormat,
} from '@wsb/core'
import { t, type Locale } from './i18n.js'
import type { TuiSettings } from './settings.js'

export interface MonthCellView {
  prayer: PrayerName
  label: string
  time: string
  current: boolean
}

export interface MonthRowView {
  date: string
  day: string
  weekday: string
  hijri: string
  today: boolean
  cells: MonthCellView[]
}

export interface MonthView {
  month: string
  title: string
  rows: MonthRowView[]
  columns: { prayer: PrayerName; label: string }[]
  stale: boolean
  /** True when some days of the month could not be read. */
  partial: boolean
}

export interface MonthDayInput {
  date: string
  entries: readonly PrayerEntry[]
  hijriDate: string
}

interface MonthBuildOptions {
  settings: TuiSettings
  today?: string
  nowSeconds?: number
}

/** Builds display-ready rows for every loaded day of the month. */
export function buildMonthView(
  days: readonly MonthDayInput[],
  month: string,
  options: MonthBuildOptions,
): MonthView {
  const { settings } = options
  const locale: Locale = settings.locale
  const district: District = settings.district
  const format: TimeFormat = settings.timeFormat ?? DEFAULT_TIME_FORMAT
  const today = options.today
  const nowSeconds = options.nowSeconds ?? -1
  const label = (prayer: PrayerName) => t(locale, `prayer.${prayer}`)

  return {
    month,
    title: formatMonth(month, locale),
    columns: PRAYER_ORDER.map((prayer) => ({ prayer, label: label(prayer) })),
    stale: false,
    partial: false,
    rows: days.map((day) => {
      const entries = adjustForDistrict(day.entries, district)
      const isToday = day.date === today
      const progress = prayerProgress(entries, isToday ? nowSeconds : -1)
      return {
        date: day.date,
        day: formatDayNumber(day.date, locale),
        weekday: formatWeekday(day.date, locale, 'short'),
        hijri: day.hijriDate,
        today: isToday,
        cells: PRAYER_ORDER.map((prayer) => {
          const entry = entries.find((item) => item.prayer === prayer)
          return {
            prayer,
            label: label(prayer),
            time: entry ? formatTime(entry.minutes, locale, format) : '—',
            current: isToday && progress.current === prayer,
          }
        }),
      }
    }),
  }
}

/** The five fard entries win the narrow width; the optional ones shed first. */
const FARD: PrayerName[] = ['subuh', 'zuhur', 'asar', 'maghrib', 'isyak']
const OPTIONAL: PrayerName[] = ['imsak', 'syuruk', 'doha']

/**
 * Picks at most `count` columns, keeping calendar order but choosing by
 * priority, so a narrow terminal hides Imsak before it hides Isyak.
 */
export function chooseMonthColumns<T extends { prayer: PrayerName }>(
  columns: readonly T[],
  count: number,
): T[] {
  if (count >= columns.length) return [...columns]
  const keep = new Set<PrayerName>()
  for (const prayer of [...FARD, ...OPTIONAL]) {
    if (keep.size >= count) break
    if (columns.some((column) => column.prayer === prayer)) keep.add(prayer)
  }
  return columns.filter((column) => keep.has(column.prayer))
}

/** The month an ISO date belongs to, for the initial view. */
export function initialMonth(today: string): string {
  return monthOf(today)
}
