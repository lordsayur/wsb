// specs/notifications/spec.md — reads announcements from Supabase and keeps
// the device's seen mark. Announcements are public read; publishing is the
// `admin` Edge Function's job, never this shell's.
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  activeAnnouncements,
  unreadCount,
  versionNotices,
  type Announcement,
  type AnnouncementLocale,
  type AnnouncementInput,
  type VersionNotice,
} from '@wsb/data/notifications'
import { CHANGELOG } from '~/utils/changelog'
import { supabaseClient } from '~/utils/supabase'

export const SEEN_COOKIE = 'wsb.notificationsSeen'
const SEEN_MAX_AGE = 60 * 60 * 24 * 365

/** What the device last acknowledged: when, and which version was running. */
export interface SeenMark {
  at: string
  version: string
}

function isLocale(value: string): value is AnnouncementLocale {
  return value === 'ms' || value === 'en' || value === 'ar' || value === 'ms-Arab'
}

export function toAnnouncement(row: {
  id: string
  published_at: string
  expires_at: string | null
  link: string | null
  messages: unknown
}): Announcement | null {
  const raw = row.messages as Record<string, unknown> | null
  if (!raw || typeof raw !== 'object') return null
  const messages: Announcement['messages'] = {}
  for (const [locale, message] of Object.entries(raw)) {
    if (!isLocale(locale)) continue
    const fields = message as { title?: unknown; body?: unknown }
    if (typeof fields.title !== 'string' || typeof fields.body !== 'string') {
      continue
    }
    messages[locale] = { title: fields.title, body: fields.body }
  }
  if (!messages.ms) return null
  return {
    id: row.id,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    link: row.link ?? '',
    messages,
  }
}

export async function fetchAnnouncements(
  client: SupabaseClient | null = supabaseClient(),
): Promise<Announcement[]> {
  if (!client) return []
  const { data, error } = await client
    .from('announcements')
    .select('id,published_at,expires_at,link,messages')
    .order('published_at', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data
    .map((row) =>
      toAnnouncement(
        row as {
          id: string
          published_at: string
          expires_at: string | null
          link: string | null
          messages: unknown
        },
      ),
    )
    .filter((item): item is Announcement => item !== null)
}

export interface NotificationFeed {
  announcements: Announcement[]
  versions: VersionNotice[]
  unread: number
}

/**
 * The page's whole state: active announcements, version notices newer than the
 * seen mark, and the unread total. A failed read yields version notices only.
 */
export async function loadFeed(
  options: {
    at?: Date
    seen?: SeenMark | null
    client?: SupabaseClient | null
  } = {},
): Promise<NotificationFeed> {
  const at = options.at ?? new Date()
  const seen = options.seen ?? null
  const announcements = activeAnnouncements(
    await fetchAnnouncements(options.client),
    at,
  )
  const versions = versionNotices(
    CHANGELOG.entries,
    CHANGELOG.version,
    seen?.version ?? null,
  )
  return {
    announcements,
    versions,
    unread: unreadCount({ announcements, versions, seenAt: seen?.at ?? null }),
  }
}

/**
 * The device's seen mark. Created in setup, so the cookie ref outlives the
 * async work that follows it.
 */
export function useSeenMark() {
  const cookie = useCookie<SeenMark | null>(SEEN_COOKIE, {
    maxAge: SEEN_MAX_AGE,
    sameSite: 'lax',
  })

  function read(): SeenMark | null {
    const value = cookie.value
    if (!value || typeof value !== 'object') return null
    if (typeof value.at !== 'string' || Number.isNaN(Date.parse(value.at))) {
      return null
    }
    return { at: value.at, version: String(value.version ?? '') }
  }

  function write(at: Date = new Date(), version: string = CHANGELOG.version) {
    cookie.value = { at: at.toISOString(), version }
  }

  return { read, write }
}

export function useNotifications() {
  const client = supabaseClient()
  const seenMark = useSeenMark()
  const feed = ref<NotificationFeed>({
    announcements: [],
    versions: [],
    unread: 0,
  })
  const state = ref<'idle' | 'loading' | 'ready'>('idle')

  /**
   * Loads what was new when the page opened, then acknowledges it. The list
   * stays on screen afterwards; only the unread dot clears on the next visit.
   */
  async function open() {
    state.value = 'loading'
    const seen = seenMark.read()
    feed.value = await loadFeed({ seen, client })
    state.value = 'ready'
    seenMark.write()
  }

  async function load() {
    state.value = 'loading'
    feed.value = await loadFeed({ seen: seenMark.read(), client })
    state.value = 'ready'
  }

  return { feed, state, open, load, seenMark }
}

/** The publish payload the admin page sends. */
export type PublishInput = AnnouncementInput
