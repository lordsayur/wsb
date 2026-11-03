// specs/web/spec.md — keep the screen awake while the dashboard is on show.
// The Screen Wake Lock API is request-based and the browser releases the lock
// whenever the page is hidden, so the preference is remembered and the lock is
// re-requested when the page comes back.
const PREFERENCE_KEY = 'wsb.keepAwake'

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

type WakeLockCapableNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

export function useWakeLock() {
  const supported = useState<boolean>('wsb:wakeLockSupported', () => false)
  const enabled = useState<boolean>('wsb:wakeLockEnabled', () => false)
  /** True while the browser actually holds the lock. */
  const active = useState<boolean>('wsb:wakeLockActive', () => false)

  let sentinel: WakeLockSentinelLike | null = null
  let listening = false

  function release() {
    active.value = false
    const current = sentinel
    sentinel = null
    void current?.release().catch(() => undefined)
  }

  async function acquire() {
    if (!import.meta.client || !enabled.value) return
    const wakeLock = (navigator as WakeLockCapableNavigator).wakeLock
    if (!wakeLock) return
    try {
      sentinel = await wakeLock.request('screen')
      active.value = true
      // The browser drops the lock on its own (tab hidden, battery saver).
      sentinel.addEventListener('release', () => {
        active.value = false
        sentinel = null
      })
    } catch {
      // Denied or unsupported in this context; keep the preference, stay quiet.
      active.value = false
      sentinel = null
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') void acquire()
    else active.value = false
  }

  function listen() {
    if (listening || !import.meta.client) return
    document.addEventListener('visibilitychange', onVisibility)
    listening = true
  }

  function unlisten() {
    if (!listening || !import.meta.client) return
    document.removeEventListener('visibilitychange', onVisibility)
    listening = false
  }

  function persist() {
    if (!import.meta.client) return
    try {
      window.localStorage.setItem(PREFERENCE_KEY, enabled.value ? 'on' : 'off')
    } catch {
      // Storage can be unavailable in private modes; the toggle still works.
    }
  }

  async function enable() {
    enabled.value = true
    persist()
    listen()
    await acquire()
  }

  function disable() {
    enabled.value = false
    persist()
    unlisten()
    release()
  }

  async function toggle() {
    if (enabled.value) disable()
    else await enable()
  }

  function stop() {
    unlisten()
    release()
  }

  function hydrate() {
    if (!import.meta.client) return
    supported.value = Boolean((navigator as WakeLockCapableNavigator).wakeLock)
    let saved = false
    try {
      saved = window.localStorage.getItem(PREFERENCE_KEY) === 'on'
    } catch {
      saved = false
    }
    if (saved && supported.value) void enable()
  }

  onBeforeUnmount(stop)

  return { supported, enabled, active, toggle, hydrate, stop }
}
