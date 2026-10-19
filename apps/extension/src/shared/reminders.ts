// specs/extension/spec.md — reminder glue. Core owns the schedule; this file
// only turns due reminders into browser notifications and alarms.
import {
  formatTime,
  notificationSchedule,
  type PrayerNotification,
} from '@wsb/core'
import { t } from './i18n.js'
import type { ExtensionSettings } from './settings.js'
import type { DayInput } from './view.js'

export const ALARM_NAME = 'wsb:reminders'
export const FIRED_KEY = 'wsb.extension.fired'
/** Also catch reminders missed while the browser slept, up to this lateness. */
export const LATE_WINDOW_SECONDS = 120

export interface Reminder {
  id: string
  event: PrayerNotification
}

/**
 * Reminders due from `LATE_WINDOW_SECONDS` ago through the next minute.
 * `alreadyFired` suppresses repeats from an overlapping alarm tick.
 */
export function dueReminders(
  entries: DayInput['entries'],
  nowSeconds: number,
  alreadyFired: readonly string[] = [],
): Reminder[] {
  const windowStart = nowSeconds - LATE_WINDOW_SECONDS
  return notificationSchedule(entries, windowStart)
    .filter(
      (event) => event.secondsUntil <= LATE_WINDOW_SECONDS + 60,
    )
    .map((event) => ({
      id: `${event.prayer}:${event.kind}:${event.atSeconds}`,
      event,
    }))
    .filter((reminder) => !alreadyFired.includes(reminder.id))
}

export function reminderText(
  event: PrayerNotification,
  settings: ExtensionSettings,
): { title: string; message: string } {
  const prayer = t(settings.locale, `prayer.${event.prayer}`)
  const title = t(
    settings.locale,
    event.kind === 'lead' ? 'notification.lead' : 'notification.due',
    { prayer },
  )
  const message = t(settings.locale, 'notification.body', {
    prayer,
    time: formatTime(event.minutes, settings.locale, settings.timeFormat),
  })
  return { title, message }
}
