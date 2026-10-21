// specs/web/spec.md — device notifications: prefer the service worker so they
// work while the installed PWA runs in the background. One stored choice
// (`wsb.notifications`) gates prayer reminders and tasbih milestones alike.
export const NOTIFICATIONS_ENABLED_KEY = 'wsb.notifications'

export function deviceNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function deviceNotificationsEnabled(): boolean {
  return (
    deviceNotificationsSupported() &&
    Notification.permission === 'granted' &&
    window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === 'on'
  )
}

/** Requests browser permission and remembers the choice. */
export async function requestDeviceNotifications(): Promise<boolean> {
  if (!deviceNotificationsSupported()) return false
  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission
  const enabled = permission === 'granted'
  window.localStorage.setItem(
    NOTIFICATIONS_ENABLED_KEY,
    enabled ? 'on' : 'off',
  )
  return enabled
}

export async function showDeviceNotification(
  title: string,
  body: string,
  tag: string,
): Promise<void> {
  if (!deviceNotificationsEnabled()) return

  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    tag,
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  }
  new Notification(title, options)
}
