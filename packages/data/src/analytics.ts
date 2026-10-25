// specs/analytics/spec.md — pageview vocabulary and validation.
// Pure functions shared by the web plugin and its tests; no I/O, no vendor
// types. The database re-validates everything, so this only shapes the row.
import { DEFAULT_DISTRICT, DISTRICTS, type District } from '@wsb/core'

export const ANALYTICS_EVENTS = ['pageview'] as const
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

export const ANALYTICS_ENVIRONMENTS = [
  'production',
  'preview',
  'development',
] as const
export type AnalyticsEnvironment = (typeof ANALYTICS_ENVIRONMENTS)[number]

export const ANALYTICS_DEVICES = ['mobile', 'tablet', 'desktop'] as const
export type AnalyticsDevice = (typeof ANALYTICS_DEVICES)[number]

export type PageviewProps = {
  view?: 'day' | 'month'
  month?: string
  district?: District
  range?: 'week' | 'month' | 'year'
}

/** One row for `analytics_events`, with keys in the table's shape. */
export interface AnalyticsEventRow {
  path: string
  event: AnalyticsEvent
  props: PageviewProps
  locale: string
  device: AnalyticsDevice
  referrer_host: string | null
  environment: AnalyticsEnvironment
  session_id: string
}

export interface PageviewInput {
  path: string
  /** Raw query string, with or without the leading `?`. */
  search?: string
  locale: string
  /** Viewport width in CSS pixels. */
  width: number
  /** Full referring URL; same-origin and empty values record nothing. */
  referrer?: string | null
  /** The app's own origin, used to drop self-referrals. */
  origin?: string | null
  environment: AnalyticsEnvironment
  sessionId: string
  userAgent?: string | null
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const SESSION = /^[A-Za-z0-9_-]{8,64}$/
const BOT = /bot|crawler|spider|headless|slurp|bingpreview/i
const ENVIRONMENTS: readonly string[] = ANALYTICS_ENVIRONMENTS
const DISTRICTS_KNOWN: readonly string[] = DISTRICTS

/** specs/web/spec.md — 768px and wider is non-mobile; 1024px is desktop. */
export function deviceClass(width: number): AnalyticsDevice {
  if (!Number.isFinite(width) || width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function isAnalyticsEnvironment(
  value: unknown,
): value is AnalyticsEnvironment {
  return (
    typeof value === 'string' && ENVIRONMENTS.includes(value)
  )
}

/**
 * Builds the row the browser inserts. Returns `null` when the event must not
 * be recorded at all: `/admin`, a bot, or a malformed session id.
 */
export function buildPageview(
  input: PageviewInput,
): AnalyticsEventRow | null {
  if (!isAnalyticsEnvironment(input.environment)) return null
  if (!SESSION.test(input.sessionId)) return null
  if (input.userAgent && BOT.test(input.userAgent)) return null

  const path = pathOf(input.path)
  if (!path || isAdminPath(path)) return null

  const search = new URLSearchParams(
    (input.search ?? '').replace(/^\?/, ''),
  )

  return {
    path,
    event: 'pageview',
    props: pageviewProps(path, search),
    locale: normalizeLocale(input.locale),
    device: deviceClass(input.width),
    referrer_host: referrerHost(input.referrer, input.origin),
    environment: input.environment,
    session_id: input.sessionId,
  }
}

/** The route path without its query string, bounded to the column size. */
function pathOf(path: string): string | null {
  const bare = path.split(/[?#]/, 1)[0] ?? ''
  if (!bare.startsWith('/') || bare.length > 200) return null
  return bare
}

function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}

/** Allowlisted keys only; unknown query keys never reach the table. */
function pageviewProps(
  path: string,
  search: URLSearchParams,
): PageviewProps {
  const props: PageviewProps = {}

  if (path === '/') {
    props.view = search.get('view') === 'month' ? 'month' : 'day'
    const month = search.get('month')
    if (month && MONTH.test(month)) props.month = month
  }

  if (path === '/trend') {
    const range = search.get('range')
    if (range === 'week' || range === 'month' || range === 'year') {
      props.range = range
    }
  }

  const district = search.get('district')
  if (
    district &&
    DISTRICTS_KNOWN.includes(district) &&
    district !== DEFAULT_DISTRICT
  ) {
    props.district = district as District
  }

  return props
}

function normalizeLocale(locale: string): string {
  const value = locale.trim().slice(0, 8)
  return value || 'ms'
}

/** Host only, no path or query; same-origin and empty referrers are dropped. */
function referrerHost(
  referrer: string | null | undefined,
  origin: string | null | undefined,
): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    const own = origin ? new URL(origin).host : ''
    if (!url.host || url.host === own) return null
    return url.host.slice(0, 100)
  } catch {
    return null
  }
}
