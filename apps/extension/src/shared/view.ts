// specs/extension/spec.md — shell presentation. Builds display-ready strings
// from core; no time math or offsets happen here.
import {
  DEFAULT_TIME_FORMAT,
  adjustForDistrict,
  bruneiNow,
  durationParts,
  formatDate,
  formatHijriDate,
  formatTime,
  formatWeekday,
  prayerProgress,
  type PrayerEntry,
  type TimeFormat,
} from '@wsb/core'
import type { ExtensionSettings } from './settings.js'
import { t } from './i18n.js'

export interface RowView {
  prayer: string
  label: string
  time: string
  current: boolean
}

export interface DayView {
  weekday: string
  masihi: string
  hijri: string
  next: string
  nextPrayer: string
  soon: boolean
  rows: RowView[]
}

export interface DayInput {
  date: string
  entries: readonly PrayerEntry[]
  hijriDate: string
}

/** Renders one loaded day for the popup/header. */
export function buildDayView(
  day: DayInput,
  settings: ExtensionSettings,
  nowSeconds: number = bruneiNow().seconds,
): DayView {
  const locale = settings.locale
  const format: TimeFormat = settings.timeFormat ?? DEFAULT_TIME_FORMAT
  const entries = adjustForDistrict(day.entries, settings.district)
  const progress = prayerProgress(entries, nowSeconds)
  const total = progress.secondsToNext
  const parts = durationParts(total)
  const duration =
    total < 60
      ? t(locale, 'duration.seconds', { seconds: parts.seconds })
      : parts.hours > 0
        ? t(locale, 'duration.hoursMinutes', {
            hours: parts.hours,
            minutes: parts.minutes,
          })
        : t(locale, 'duration.minutes', { minutes: parts.minutes })
  const label = (prayer: string) => t(locale, `prayer.${prayer}`)

  return {
    weekday: formatWeekday(day.date, locale),
    masihi: formatDate(day.date, locale),
    hijri: formatHijriDate(day.date, locale, day.hijriDate),
    next: t(locale, 'next.in', {
      duration,
      prayer: label(progress.next),
    }),
    nextPrayer: label(progress.next),
    soon: total <= 15 * 60,
    rows: entries.map((entry) => ({
      prayer: entry.prayer,
      label: label(entry.prayer),
      time: formatTime(entry.minutes, locale, format),
      current: entry.prayer === progress.current,
    })),
  }
}

/** The one-line summary injected into pages by the content script. */
export function buildHeaderText(day: DayView): string {
  return day.next
}
