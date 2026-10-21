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

export type NotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied'

export function usePrayerNotifications(
  entries: () => readonly PrayerEntry[],
  locale: () => string,
  t: (key: string, args?: Record<string, unknown>) => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
) {  const supported =
    typeof window !== 'undefined' && 'Notification' in window
  const enabled = ref(false)
  const status = ref<NotificationStatus>(
    supported ? (Notification.permission as NotificationStatus) : 'unsupported',
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: PrayerNotification | undefined

  // ponytail: in-app timers only reach the user while the app runs. Upgrade
  // path is Web Push with a scheduled backend, which needs a server.
  function schedule() {
    clearTimeout(timer)
    pending = undefined
    if (!enabled.value || status.value !== 'granted') return
    const [next] = notificationSchedule(entries(), bruneiNow().seconds)
    if (!next) return
    pending = next
    timer = setTimeout(fire, Math.max(0, next.secondsUntil) * 1_000)
  }

  async function fire() {
    const event = pending
    pending = undefined
    if (event && enabled.value && status.value === 'granted') {
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
