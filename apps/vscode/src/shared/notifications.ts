// specs/vscode/spec.md — reminder glue. Core owns the schedule; this file
// picks the next event to fire and turns a due reminder into localized text.
import {
  formatTime,
  notificationSchedule,
  type PrayerEntry,
  type PrayerNotification,
} from '@wsb/core'
import { t } from './i18n.js'
import type { ExtensionSettings } from './settings.js'

/** Also catch a reminder missed while the host slept, up to this lateness. */
export const LATE_WINDOW_SECONDS = 120

export function reminderId(event: PrayerNotification): string {
  return `${event.prayer}:${event.kind}:${event.atSeconds}`
}

/**
 * The next reminder worth scheduling: due now (within the one-minute tick plus
 * the late window) and not already fired, else the upcoming one. `null` when
 * notifications are off or nothing is left.
 */
export function nextReminder(
  entries: readonly PrayerEntry[],
  nowSeconds: number,
  alreadyFired: ReadonlySet<string>,
  lateWindow = LATE_WINDOW_SECONDS,
): PrayerNotification | null {
  const upcoming = notificationSchedule(entries, nowSeconds - lateWindow)
  const due = upcoming.find(
    (event) =>
      event.secondsUntil <= lateWindow + 60 && !alreadyFired.has(reminderId(event)),
  )
  return due ?? upcoming.find((event) => !alreadyFired.has(reminderId(event))) ?? null
}

/** True when the event is due now rather than merely upcoming. */
export function isDue(
  event: PrayerNotification,
  lateWindow = LATE_WINDOW_SECONDS,
): boolean {
  return event.secondsUntil <= lateWindow + 60
}

export function reminderText(
  event: PrayerNotification,
  settings: ExtensionSettings,
): { title: string; body: string } {
  const prayer = t(settings.locale, `prayer.${event.prayer}`)
  const title = t(
    settings.locale,
    event.kind === 'lead' ? 'notification.lead' : 'notification.due',
    { prayer },
  )
  const body = t(settings.locale, 'notification.body', {
    prayer,
    time: formatTime(event.minutes, settings.locale, settings.timeFormat),
  })
  return { title, body }
}
