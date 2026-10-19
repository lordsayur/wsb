import { describe, expect, it } from 'vitest'
import { buildDayView } from './view.js'
import { dueReminders, reminderText } from './reminders.js'
import { resolveSettings, DEFAULT_SETTINGS } from './settings.js'
import { isRtl, t } from './i18n.js'
import { isNewer } from './update.js'
import type { PrayerEntry } from '@wsb/core'

// specs/extension/spec.md — shell formatting, reminders and settings.
const entries: PrayerEntry[] = [
  { prayer: 'imsak', minutes: 4 * 60 + 41 },
  { prayer: 'subuh', minutes: 4 * 60 + 50 },
  { prayer: 'syuruk', minutes: 6 * 60 + 5 },
  { prayer: 'doha', minutes: 6 * 60 + 40 },
  { prayer: 'zuhur', minutes: 12 * 60 + 5 },
  { prayer: 'asar', minutes: 15 * 60 + 20 },
  { prayer: 'maghrib', minutes: 18 * 60 + 10 },
  { prayer: 'isyak', minutes: 19 * 60 + 20 },
]
const day = { date: '2026-10-18', entries, hijriDate: '7 Jamadilawal 1448 H' }

describe('settings', () => {
  it('defaults: notifications off, header on, Malay, 24h, default district', () => {
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS).toMatchObject({
      notifications: false,
      header: true,
      locale: 'ms',
      timeFormat: '24h',
      district: 'bruneiMuara',
    })
  })

  it('falls back safely on unknown stored values', () => {
    expect(
      resolveSettings({ locale: 'fr', timeFormat: 'nope', district: 'mars' }),
    ).toMatchObject({ locale: 'ms', timeFormat: '24h', district: 'bruneiMuara' })
  })

  it('accepts the Arabic-script locales', () => {
    expect(resolveSettings({ locale: 'ar' }).locale).toBe('ar')
    expect(resolveSettings({ locale: 'ms-Arab' }).locale).toBe('ms-Arab')
  })
})

describe('buildDayView', () => {
  it('renders eight labeled rows and highlights the current entry', () => {
    const view = buildDayView(
      day,
      { ...DEFAULT_SETTINGS },
      12 * 60 * 60 + 10 * 60,
    )
    expect(view.rows.map((row) => row.prayer)).toEqual([
      'imsak',
      'subuh',
      'syuruk',
      'doha',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
    expect(view.rows.filter((row) => row.current).map((row) => row.prayer)).toEqual([
      'zuhur',
    ])
    expect(view.rows[1]!.time).toBe('04:50')
  })

  it('applies the district offset (+3 for Belait)', () => {
    const view = buildDayView(day, { ...DEFAULT_SETTINGS, district: 'belait' }, 0)
    expect(view.rows[1]!.time).toBe('04:53')
  })

  it('renders 12-hour times when chosen', () => {
    const view = buildDayView(day, { ...DEFAULT_SETTINGS, timeFormat: '12h' }, 0)
    expect(view.rows[1]!.time).toMatch(/04:50\s?(PG|AM)/i)
  })

  it('shows the next entry and duration in Malay by default', () => {
    const view = buildDayView(day, DEFAULT_SETTINGS, 12 * 60 * 60 + 10 * 60)
    expect(view.next).toContain('Asar')
    expect(view.next).toContain('3 jam 10 minit')
  })

  it('uses Arabic-Indic digits for Arabic-script locales', () => {
    const view = buildDayView(
      day,
      { ...DEFAULT_SETTINGS, locale: 'ar' },
      12 * 60 * 60 + 10 * 60,
    )
    expect(view.rows[1]!.time).toBe('٠٤:٥٠')
    expect(view.next).toContain('٣ ساعة ١٠ دقيقة')
    expect(view.masihi).toContain('٢٠٢٦')
  })
})

describe('dueReminders', () => {
  it('emits the lead reminder 15 minutes before a prayer', () => {
    const now = (12 * 60 + 5 - 15) * 60
    const due = dueReminders(entries, now)
    expect(due).toHaveLength(1)
    expect(due[0]!.event).toMatchObject({ prayer: 'zuhur', kind: 'lead' })
  })

  it('emits the due reminder at the prayer time', () => {
    const due = dueReminders(entries, (12 * 60 + 5) * 60)
    expect(due).toHaveLength(1)
    expect(due[0]!.event).toMatchObject({ prayer: 'zuhur', kind: 'due' })
  })

  it('never reminds for imsak, syuruk or doha', () => {
    const due = dueReminders(entries, 6 * 60 * 60)
    expect(due).toHaveLength(0)
  })

  it('suppresses a repeat of the last fired reminder', () => {
    const now = (12 * 60 + 5) * 60
    const first = dueReminders(entries, now)
    const again = dueReminders(entries, now, [first[0]!.id])
    expect(again).toHaveLength(0)
  })

  it('catches a reminder missed by a late alarm', () => {
    const due = dueReminders(entries, (12 * 60 + 5) * 60 + 60)
    expect(due.map((reminder) => reminder.event.kind)).toContain('due')
  })
})

describe('reminderText', () => {
  it('localizes title and body with the chosen time format', () => {
    const text = reminderText(
      {
        prayer: 'zuhur',
        kind: 'lead',
        minutes: 12 * 60 + 5,
        atSeconds: 0,
        secondsUntil: 0,
      },
      { ...DEFAULT_SETTINGS, timeFormat: '12h' },
    )
    expect(text.title).toBe('Zuhur dalam 15 minit')
    expect(text.message).toMatch(/Zuhur pada 12:05/)
  })
})

describe('i18n', () => {
  it('resolves keys and interpolates', () => {
    expect(t('en', 'notification.due', { prayer: 'Asar' })).toBe(
      'It is time for Asar',
    )
    expect(t('ms', 'missing.key')).toBe('missing.key')
  })

  it('resolves Arabic and Jawi catalogues', () => {
    expect(t('ar', 'prayer.zuhur')).toBe('الظهر')
    expect(t('ms-Arab', 'prayer.zuhur')).toBe('ظهر')
  })

  it('marks Arabic-script locales as right-to-left', () => {
    expect(isRtl('ar')).toBe(true)
    expect(isRtl('ms-Arab')).toBe(true)
    expect(isRtl('ms')).toBe(false)
    expect(isRtl('en')).toBe(false)
  })
})

describe('isNewer', () => {
  it('compares semver tags against the installed version', () => {
    expect(isNewer('v0.2.0', '0.1.0')).toBe(true)
    expect(isNewer('v0.1.1', '0.1.0')).toBe(true)
    expect(isNewer('v1.0.0', '0.9.9')).toBe(true)
  })

  it('is false for the same or older release', () => {
    expect(isNewer('v0.1.0', '0.1.0')).toBe(false)
    expect(isNewer('v0.0.9', '0.1.0')).toBe(false)
    expect(isNewer('0.1.0', 'v0.1.0')).toBe(false)
  })

  it('treats missing segments as zero', () => {
    expect(isNewer('v0.2', '0.1.9')).toBe(true)
    expect(isNewer('v0.1', '0.1.0')).toBe(false)
  })
})
