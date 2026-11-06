import { describe, expect, it } from 'vitest'
import { toAnnouncement } from './useNotifications'

// specs/notifications/spec.md — the row -> announcement mapping the page uses.

const row = {
  id: 'a1',
  published_at: '2026-11-01T00:00:00.000Z',
  expires_at: null,
  link: '/changelog',
  messages: {
    ms: { title: 'Tajuk', body: 'Badan' },
    en: { title: 'Title', body: 'Body' },
    fr: { title: 'Titre', body: 'Corps' },
  },
}

describe('toAnnouncement', () => {
  it('keeps known locales and drops the rest', () => {
    expect(toAnnouncement(row)?.messages).toEqual({
      ms: { title: 'Tajuk', body: 'Badan' },
      en: { title: 'Title', body: 'Body' },
    })
  })

  it('drops rows without Malay text', () => {
    expect(toAnnouncement({ ...row, messages: { en: { title: 'T', body: 'B' } } })).toBeNull()
  })

  it('drops rows with a malformed message', () => {
    expect(
      toAnnouncement({ ...row, messages: { ms: { title: 'only' } } }),
    ).toBeNull()
  })

  it('treats a missing link as empty', () => {
    expect(toAnnouncement({ ...row, link: null })?.link).toBe('')
  })
})
