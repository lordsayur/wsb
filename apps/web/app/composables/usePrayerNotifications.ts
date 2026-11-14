// specs/web/spec.md — device notifications at each prayer and 15 minutes before.
// Best-effort while the app (or its PWA service worker) is running; true
// background delivery needs push, see ponytail note below.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  DEFAULT_TIME_FORMAT,
  bruneiNow,
  formatTime,
  notificationSchedule,
  type PrayerEntry,
  type PrayerNotification,
  type TimeFormat,
} from '@wsb/core'
import {
  NOTIFICATIONS_ENABLED_KEY,
  showDeviceNotification,
} from '~/utils/notify'

const ENABLED_KEY = NOTIFICATIONS_ENABLED_KEY
/** Reminders already shown, so a reload in the same second cannot repeat one. */
const FIRED_KEY = 'wsb.prayerReminders.fired'
/** How many fired reminder ids to remember; the 24-hour schedule is ten. */
const FIRED_LIMIT = 40

export type NotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied'

/**
 * Stable id for one reminder occurrence. `atSeconds` carries the day, so the
 * same prayer tomorrow is a different reminder.
 */
export function reminderKey(event: PrayerNotification): string {
  return `${event.prayer}:${event.kind}:${event.atSeconds}`
}

/**
 * The reminder to put on the timer: the nearest event that has not fired yet.
 * The schedule still lists the event that just fired (its `secondsUntil` is
 * 0), so without the fired set the timer re-arms it and repeats itself for
 * the rest of that second.
 */
export function pendingReminder(
  events: readonly PrayerNotification[],
  fired: ReadonlySet<string> = new Set(),
): PrayerNotification | undefined {
  return events.find((event) => !fired.has(reminderKey(event)))
}

export function usePrayerNotifications(
  entries: () => readonly PrayerEntry[],
  locale: () => string,
  t: (key: string, args?: Record<string, unknown>) => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
) {
  const supported =
    typeof window !== 'undefined' && 'Notification' in window
  const enabled = ref(false)
  const status = ref<NotificationStatus>(
    supported ? (Notification.permission as NotificationStatus) : 'unsupported',
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: PrayerNotification | undefined
  /** Recent reminder ids, so one occurrence never notifies twice. */
  const fired = new Set<string>()

  function loadFired() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(FIRED_KEY) ?? '[]')
      if (Array.isArray(stored)) {
        for (const id of stored) if (typeof id === 'string') fired.add(id)
      }
    } catch {
      // A corrupt entry only costs a duplicate reminder; start clean.
    }
  }

  function remember(id: string) {
    fired.add(id)
    while (fired.size > FIRED_LIMIT) {
      fired.delete(fired.values().next().value as string)
    }
    try {
      window.localStorage.setItem(FIRED_KEY, JSON.stringify([...fired]))
    } catch {
      // Storage can be full or blocked; the in-memory set still dedupes.
    }
  }

  // ponytail: in-app timers only reach the user while the app runs. Upgrade
  // path is Web Push with a scheduled backend, which needs a server.
  function schedule() {
    clearTimeout(timer)
    pending = undefined
    if (!enabled.value || status.value !== 'granted') return
    const now = bruneiNow().seconds
    const next = pendingReminder(notificationSchedule(entries(), now), fired)
    if (!next) return
    pending = next
    timer = setTimeout(fire, Math.max(0, next.secondsUntil) * 1_000)
  }

  async function fire() {
    const event = pending
    pending = undefined
    if (event && enabled.value && status.value === 'granted') {
      // Record before showing: a throw or a slow service worker must not
      // leave the same occurrence armed for a second notification.
      remember(reminderKey(event))
      await show(event)
    }
    schedule()
  }

  async function show(event: PrayerNotification) {
    const prayer = t(`prayer.${event.prayer}`)
    const title = t(
      event.kind === 'lead' ? 'notification.lead' : 'notification.due',
      { prayer },
    )
    const body = t('notification.body', {
      prayer,
      time: formatTime(event.minutes, locale(), timeFormat()),
    })
    await showDeviceNotification(title, body, `wsb-${event.prayer}-${event.kind}`)
  }

  async function enable() {
    if (!supported) return
    status.value = Notification.permission as NotificationStatus
    if (status.value === 'default') {
      status.value = (await Notification.requestPermission()) as NotificationStatus
    }
    enabled.value = status.value === 'granted'
    persist()
    schedule()
  }

  function disable() {
    enabled.value = false
    persist()
    schedule()
  }

  function toggle() {
    if (enabled.value) disable()
    else void enable()
  }

  function persist() {
    window.localStorage.setItem(ENABLED_KEY, enabled.value ? 'on' : 'off')
  }

  const label = computed(() => {
    if (status.value === 'unsupported') return t('notification.unsupported')
    if (status.value === 'denied') return t('notification.blocked')
    return enabled.value ? t('notification.enabled') : t('notification.enable')
  })

  onMounted(() => {
    enabled.value =
      supported && window.localStorage.getItem(ENABLED_KEY) === 'on'
    if (supported) {
      status.value = Notification.permission as NotificationStatus
      if (status.value !== 'granted') enabled.value = false
    }
    if (enabled.value) loadFired()
    schedule()
  })

  watch(
    () => [
      enabled.value,
      entries()
        .map((entry) => `${entry.prayer}:${entry.minutes}`)
        .join(','),
    ],
    schedule,
  )

  onUnmounted(() => clearTimeout(timer))

  return { supported, enabled, status, label, enable, disable, toggle }
}
