// specs/tui/spec.md — shell presentation. Builds display-ready strings from
// core; no time math or offsets happen here.
import {
  DEFAULT_TIME_FORMAT,
  adjustForDistrict,
  bruneiNow,
  durationParts,
  formatDate,
  formatHijriDate,
  formatNumber,
  formatTime,
  formatWeekday,
  prayerProgress,
  type PrayerEntry,
  type PrayerName,
  type TimeFormat,
} from '@wsb/core'
import { t, type Locale } from './i18n.js'
import type { TuiSettings } from './settings.js'

export interface RowView {
  prayer: PrayerName
  label: string
  time: string
  current: boolean
  next: boolean
}

export interface DayView {
  date: string
  weekday: string
  masihi: string
  hijri: string
  next: string
  nextPrayer: string
  currentPrayer: PrayerName | null
  secondsToNext: number
  stale: boolean
  /** District-adjusted entries, for the JSON output. */
  entries: PrayerEntry[]
  rows: RowView[]
}

export interface DayInput {
  date: string
  entries: readonly PrayerEntry[]
  hijriDate: string
  stale?: boolean
}

/** Formats a duration for display in the active locale. */
export function formatDuration(seconds: number, locale: Locale): string {
  const total = Math.max(0, seconds)
  const parts = durationParts(total)
  const n = (value: number) => formatNumber(value, locale)
  if (total < 60) {
    return t(locale, 'duration.seconds', { seconds: n(parts.seconds) })
  }
  if (parts.hours > 0) {
    return t(locale, 'duration.hoursMinutes', {
      hours: n(parts.hours),
      minutes: n(parts.minutes),
    })
  }
  return t(locale, 'duration.minutes', { minutes: n(parts.minutes) })
}

/** Renders one loaded day for the interface and the piped output. */
export function buildDayView(
  day: DayInput,
  settings: TuiSettings,
  nowSeconds: number = bruneiNow().seconds,
): DayView {
  const locale = settings.locale
  const format: TimeFormat = settings.timeFormat ?? DEFAULT_TIME_FORMAT
  const entries = adjustForDistrict(day.entries, settings.district)
  const progress = prayerProgress(entries, nowSeconds)
  const label = (prayer: string) => t(locale, `prayer.${prayer}`)

  return {
    date: day.date,
    weekday: formatWeekday(day.date, locale),
    masihi: formatDate(day.date, locale),
    hijri: formatHijriDate(day.date, locale, day.hijriDate),
    next: t(locale, 'next.in', {
      duration: formatDuration(progress.secondsToNext, locale),
      prayer: label(progress.next),
    }),
    nextPrayer: progress.next,
    currentPrayer: progress.current,
    secondsToNext: progress.secondsToNext,
    stale: day.stale === true,
    entries,
    rows: entries.map((entry) => ({
      prayer: entry.prayer,
      label: label(entry.prayer),
      time: formatTime(entry.minutes, locale, format),
      current: entry.prayer === progress.current,
      next: entry.prayer === progress.next,
    })),
  }
}
