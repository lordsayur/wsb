// specs/analytics/spec.md — one pageview per route change, browser only.
// Cookieless, fire-and-forget, dropped on failure. Never in dev, never for
// `/admin`, never without Supabase config.
import { buildPageview, type AnalyticsEnvironment } from '@wsb/data/analytics'

const SESSION_KEY = 'wsb.analytics.session'

function newSessionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Per-tab id that dies with the tab; no cookie, no storage beyond the tab. */
function sessionId(): string {
  let value = sessionStorage.getItem(SESSION_KEY)
  if (!value || !/^[A-Za-z0-9_-]{8,64}$/.test(value)) {
    value = newSessionId()
    sessionStorage.setItem(SESSION_KEY, value)
  }
  return value
}

export default defineNuxtPlugin({
  name: 'wsb:analytics',
  setup(nuxtApp) {
    const config = useRuntimeConfig().public
    // specs/analytics/spec.md — a dev build is a development tag, whatever the
    // configured value says, so a test can never pass for production traffic.
    const environment: AnalyticsEnvironment = import.meta.dev
      ? 'development'
      : (config.analyticsEnv as AnalyticsEnvironment)
    const enabled = config.analyticsEnabled
    // Development records nothing unless a deliberate test opts in through
    // NUXT_PUBLIC_ANALYTICS_DEV=1.
    if (environment === 'development' && !enabled) return

    const url = config.supabaseUrl
    const key = config.supabaseAnonKey
    if (!url || !key) return

    const router = useRouter()

    async function record(to: { path: string; fullPath: string }) {
      const row = buildPageview({
        path: to.path,
        search: to.fullPath.split('?')[1] ?? '',
        locale: nuxtApp.$i18n.locale.value,
        width: window.innerWidth,
        referrer: document.referrer || null,
        origin: window.location.origin,
        environment,
        sessionId: sessionId(),
        userAgent: navigator.userAgent,
      })
      if (!row) return
      try {
        // specs/analytics/spec.md — keepalive survives an unload; a failed send
        // is dropped, never queued. ponytail: no offline queue, upgrade if the
        // numbers need it.
        await fetch(`${url}/rest/v1/analytics_events`, {
          method: 'POST',
          keepalive: true,
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(row),
        })
      } catch {
        // Dropped by design.
      }
    }

    let last: string | null = null
    router.afterEach((to) => {
      // Record the landing page too, but not a same-URL no-op navigation.
      if (to.fullPath === last) return
      last = to.fullPath
      void record(to)
    })
  },
})
