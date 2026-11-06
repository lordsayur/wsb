import { describe, expect, it } from 'vitest'
import {
  activeAnnouncements,
  announcementText,
  isAnnouncementActive,
  isAnnouncementLink,
  unreadCount,
  validateAnnouncement,
  versionNotices,
  type Announcement,
} from './notifications.js'

// specs/notifications/spec.md — announcement validation and selection rules.

function announcement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: 'a1',
    publishedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
    link: '',
    messages: { ms: { title: 'Tajuk', body: 'Badan' } },
    ...overrides,
  }
}

describe('isAnnouncementLink', () => {
  it('accepts internal paths and https URLs', () => {
    expect(isAnnouncementLink('/changelog')).toBe(true)
    expect(isAnnouncementLink('/about?x=1')).toBe(true)
    expect(isAnnouncementLink('https://example.com/post')).toBe(true)
  })

  it('rejects protocol-relative, http and javascript links', () => {
    expect(isAnnouncementLink('//example.com')).toBe(false)
    expect(isAnnouncementLink('http://example.com')).toBe(false)
    expect(isAnnouncementLink('javascript:alert(1)')).toBe(false)
    expect(isAnnouncementLink('')).toBe(false)
  })
})

describe('validateAnnouncement', () => {
  it('requires Malay text', () => {
    expect(
      validateAnnouncement({ messages: { en: { title: 'T', body: 'B' } } }),
    ).toEqual({ ok: false, error: 'Malay title and body are required' })
  })

  it('rejects a half-written locale instead of dropping it silently', () => {
    expect(
      validateAnnouncement({
        messages: {
          ms: { title: 'Tajuk', body: 'Badan' },
          en: { title: 'Only a title' },
        },
      }),
    ).toEqual({ ok: false, error: 'Incomplete text for en' })
  })

  it('trims text, drops empty locales and keeps a link and expiry', () => {
    const result = validateAnnouncement({
      messages: {
        ms: { title: '  Tajuk  ', body: '  Badan ' },
        ar: { title: '', body: '' },
      },
      link: '/changelog',
      expiresAt: '2026-12-01T00:00:00Z',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        messages: { ms: { title: 'Tajuk', body: 'Badan' } },
        link: '/changelog',
        expiresAt: '2026-12-01T00:00:00.000Z',
      },
    })
  })

  it('rejects an invalid link and an invalid expiry', () => {
    const base = { messages: { ms: { title: 'T', body: 'B' } } }
    expect(validateAnnouncement({ ...base, link: 'ftp://x' })).toEqual({
      ok: false,
      error: 'Invalid link',
    })
    expect(validateAnnouncement({ ...base, expiresAt: 'soon' })).toEqual({
      ok: false,
      error: 'Invalid expiry',
    })
  })

  it('caps very long text', () => {
    const result = validateAnnouncement({
      messages: { ms: { title: 'x'.repeat(500), body: 'y'.repeat(5000) } },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.messages.ms!.title).toHaveLength(120)
      expect(result.value.messages.ms!.body).toHaveLength(2000)
    }
  })
})

describe('announcementText', () => {
  it('prefers the reader locale, then Malay', () => {
    const item = announcement({
      messages: {
        ms: { title: 'Melayu', body: 'Badan' },
        en: { title: 'English', body: 'Body' },
      },
    })
    expect(announcementText(item, 'en').title).toBe('English')
    expect(announcementText(item, 'ar').title).toBe('Melayu')
  })
})

describe('activeAnnouncements', () => {
  it('drops expired items and sorts newest first', () => {
    const now = new Date('2026-11-05T00:00:00.000Z')
    const list = [
      announcement({ id: 'old', publishedAt: '2026-11-01T00:00:00.000Z' }),
      announcement({ id: 'new', publishedAt: '2026-11-03T00:00:00.000Z' }),
      announcement({
        id: 'expired',
        publishedAt: '2026-11-04T00:00:00.000Z',
        expiresAt: '2026-11-04T12:00:00.000Z',
      }),
    ]
    expect(activeAnnouncements(list, now).map((item) => item.id)).toEqual([
      'new',
      'old',
    ])
  })

  it('treats a missing expiry as forever', () => {
    expect(isAnnouncementActive(announcement(), new Date('2099-01-01'))).toBe(true)
  })
})

describe('versionNotices', () => {
  const entries = [
    { version: '4.0.0-beta.3', date: '2026-11-03', changes: ['c'] },
    { version: '4.0.0-beta.2', date: '2026-11-02', changes: ['b'] },
    { version: '4.0.0-beta.1', date: '2026-11-01', changes: ['a'] },
  ]

  it('lists only versions newer than the acknowledged one', () => {
    expect(
      versionNotices(entries, '4.0.0-beta.3', '4.0.0-beta.1').map(
        (entry) => entry.version,
      ),
    ).toEqual(['4.0.0-beta.3', '4.0.0-beta.2'])
  })

  it('reports just the running version with no acknowledged mark', () => {
    expect(
      versionNotices(entries, '4.0.0-beta.2', null).map((entry) => entry.version),
    ).toEqual(['4.0.0-beta.2'])
  })

  it('falls back to the running version for an unknown mark', () => {
    expect(
      versionNotices(entries, '4.0.0-beta.3', '0.0.1').map(
        (entry) => entry.version,
      ),
    ).toEqual(['4.0.0-beta.3'])
  })
})

describe('unreadCount', () => {
  const now = '2026-11-05T00:00:00.000Z'

  it('counts every announcement with no seen mark', () => {
    expect(
      unreadCount({
        announcements: [announcement({ id: 'a' }), announcement({ id: 'b' })],
        versions: [],
        seenAt: null,
      }),
    ).toBe(2)
  })

  it('counts only announcements newer than the seen mark', () => {
    const announcements = [
      announcement({
        id: 'new',
        publishedAt: '2026-11-04T12:00:00.000Z',
        expiresAt: now,
      }),
      announcement({ id: 'old', publishedAt: '2026-10-01T00:00:00.000Z' }),
    ]
    expect(
      unreadCount({ announcements, versions: [], seenAt: '2026-11-04T00:00:00.000Z' }),
    ).toBe(1)
  })

  it('adds every version notice', () => {
    expect(
      unreadCount({
        announcements: [],
        versions: [
          { version: '4.0.0-beta.3', date: '2026-11-03', changes: ['c'] },
        ],
        seenAt: now,
      }),
    ).toBe(1)
  })
})
