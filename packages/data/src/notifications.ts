// specs/notifications/spec.md — announcement payload validation and the pure
// selection rules behind `/notifications`. No vendor types and no I/O; the
// Edge Function and the web shell share these.
//
// `Validation` is restated rather than imported from `./admin.js`: this module
// is loaded by Deno (the Edge Function) as well as by the bundler, and a
// relative `.js` import only resolves in one of them.
export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

/** Locale codes the app ships. Malay is the one every announcement needs. */
export const ANNOUNCEMENT_LOCALES = ['ms', 'en', 'ar', 'ms-Arab'] as const

export type AnnouncementLocale = (typeof ANNOUNCEMENT_LOCALES)[number]

/** The required locale: an announcement is written in Malay first. */
export const REQUIRED_LOCALE: AnnouncementLocale = 'ms'

export interface AnnouncementMessages {
  title: string
  body: string
}

export interface Announcement {
  id: string
  /** ISO instant the announcement was published. */
  publishedAt: string
  /** ISO instant after which it is no longer shown; null means forever. */
  expiresAt: string | null
  /** Internal path or `https` URL; empty when there is no link. */
  link: string
  /** One message per locale; only locales with text are present. */
  messages: Partial<Record<AnnouncementLocale, AnnouncementMessages>>
}

export interface AnnouncementInput {
  messages: Partial<Record<AnnouncementLocale, AnnouncementMessages>>
  link: string
  expiresAt: string | null
}

export const TITLE_MAX = 120
export const BODY_MAX = 2000
export const LINK_MAX = 500

const LOCALE = new Set<string>(ANNOUNCEMENT_LOCALES)
const INTERNAL_PATH = /^\/(?!\/)[^\s]*$/
const HTTPS = /^https:\/\/[^\s]+$/i

export function isAnnouncementLocale(value: unknown): value is AnnouncementLocale {
  return typeof value === 'string' && LOCALE.has(value)
}

/** A link must stay inside the app or be an absolute `https` URL. */
export function isAnnouncementLink(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= LINK_MAX &&
    (INTERNAL_PATH.test(value) || HTTPS.test(value))
  )
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

/** Validates one compose payload; unknown locales are dropped. */
export function validateAnnouncement(
  value: unknown,
): Validation<AnnouncementInput> {
  const input = (value ?? {}) as {
    messages?: unknown
    link?: unknown
    expiresAt?: unknown
  }
  const raw = input.messages
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Missing messages' }
  }

  const messages: AnnouncementInput['messages'] = {}
  for (const [locale, message] of Object.entries(raw)) {
    if (!isAnnouncementLocale(locale)) continue
    const fields = (message ?? {}) as { title?: unknown; body?: unknown }
    const title = text(fields.title, TITLE_MAX)
    const body = text(fields.body, BODY_MAX)
    if (!title && !body) continue
    if (!title || !body) {
      return { ok: false, error: `Incomplete text for ${locale}` }
    }
    messages[locale] = { title, body }
  }

  if (!messages[REQUIRED_LOCALE]) {
    return { ok: false, error: 'Malay title and body are required' }
  }

  const link = typeof input.link === 'string' ? input.link.trim() : ''
  if (link && !isAnnouncementLink(link)) {
    return { ok: false, error: 'Invalid link' }
  }

  let expiresAt: string | null = null
  if (typeof input.expiresAt === 'string' && input.expiresAt.trim()) {
    const date = new Date(input.expiresAt)
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: 'Invalid expiry' }
    }
    expiresAt = date.toISOString()
  }

  return { ok: true, value: { messages, link, expiresAt } }
}

/**
 * The message a reader sees: their locale, then Malay, then whichever locale
 * was written. Never empty for a validated announcement.
 */
export function announcementText(
  announcement: Announcement,
  locale: string,
): AnnouncementMessages {
  const messages = announcement.messages
  return (
    (isAnnouncementLocale(locale) ? messages[locale] : undefined) ??
    messages[REQUIRED_LOCALE] ??
    Object.values(messages)[0] ??
    { title: '', body: '' }
  )
}

/** True while the announcement has no expiry or it is still in the future. */
export function isAnnouncementActive(
  announcement: Announcement,
  now: Date,
): boolean {
  return (
    !announcement.expiresAt ||
    new Date(announcement.expiresAt).getTime() > now.getTime()
  )
}

/** Active announcements, newest first. */
export function activeAnnouncements(
  list: readonly Announcement[],
  now: Date,
): Announcement[] {
  return list
    .filter((announcement) => isAnnouncementActive(announcement, now))
    .sort(
      (left, right) =>
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
    )
}

/** One row per changelog entry newer than `acknowledged`. */
export interface VersionNotice {
  version: string
  date: string
  changes: string[]
}

/**
 * Newer versions than the acknowledged one, newest first. A device with no
 * acknowledged version counts only the running version, so a fresh install is
 * never handed the whole history.
 */
export function versionNotices(
  entries: readonly VersionNotice[],
  running: string,
  acknowledged: string | null,
): VersionNotice[] {
  const sorted = [...entries].sort(
    (left, right) => Date.parse(right.date) - Date.parse(left.date),
  )
  if (!acknowledged) {
    const current = sorted.find((entry) => entry.version === running)
    return current ? [current] : []
  }
  const index = sorted.findIndex((entry) => entry.version === acknowledged)
  if (index === -1) {
    const current = sorted.find((entry) => entry.version === running)
    return current ? [current] : []
  }
  return sorted.slice(0, index)
}

export interface UnreadInput {
  announcements: readonly Announcement[]
  versions: readonly VersionNotice[]
  seenAt: string | null
}

/** Unread = announcements newer than the seen mark, plus every version notice. */
export function unreadCount(input: UnreadInput): number {
  const seen = input.seenAt ? Date.parse(input.seenAt) : Number.NaN
  const fresh = Number.isNaN(seen)
    ? input.announcements.length
    : input.announcements.filter(
        (announcement) => Date.parse(announcement.publishedAt) > seen,
      ).length
  return fresh + input.versions.length
}
