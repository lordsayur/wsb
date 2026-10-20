import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { buildDayView } from './view.js'
import { DEFAULT_SETTINGS, resolveSettings } from './settings.js'
import { isRtl, t } from './i18n.js'
import { mementoCache, type MementoLike } from './day.js'

// specs/vscode/spec.md — shell formatting, settings and the editor cache.
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
  it('defaults: status bar on, Malay, 24h, default district', () => {
    expect(resolveSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS).toMatchObject({
      statusBar: true,
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

  it('accepts the Arabic-script locales and a hidden status bar', () => {
    expect(resolveSettings({ locale: 'ar' }).locale).toBe('ar')
    expect(resolveSettings({ locale: 'ms-Arab' }).locale).toBe('ms-Arab')
    expect(resolveSettings({ statusBar: false }).statusBar).toBe(false)
  })
})

describe('buildDayView', () => {
  it('renders eight labeled rows and highlights the current entry', () => {
    const view = buildDayView(day, DEFAULT_SETTINGS, 12 * 60 * 60 + 10 * 60)
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
    expect(
      view.rows.filter((row) => row.current).map((row) => row.prayer),
    ).toEqual(['zuhur'])
    expect(view.rows[1]!.time).toBe('04:50')
  })

  it('applies the district offset (+1 for Tutong, +3 for Belait)', () => {
    expect(
      buildDayView(day, { ...DEFAULT_SETTINGS, district: 'tutong' }, 0).rows[1]!
        .time,
    ).toBe('04:51')
    expect(
      buildDayView(day, { ...DEFAULT_SETTINGS, district: 'belait' }, 0).rows[1]!
        .time,
    ).toBe('04:53')
  })

  it('exposes the next entry and its time for the status bar', () => {
    const view = buildDayView(day, DEFAULT_SETTINGS, 12 * 60 * 60 + 10 * 60)
    expect(view.nextPrayer).toBe('Asar')
    expect(view.nextTime).toBe('15:20')
    expect(view.next).toContain('3 jam 10 minit')
  })

  it('renders 12-hour times when chosen', () => {
    const view = buildDayView(day, { ...DEFAULT_SETTINGS, timeFormat: '12h' }, 0)
    expect(view.rows[1]!.time).toMatch(/04:50\s?(PG|AM)/i)
  })

  it('uses Arabic-Indic digits for Arabic-script locales', () => {
    const view = buildDayView(
      day,
      { ...DEFAULT_SETTINGS, locale: 'ar' },
      12 * 60 * 60 + 10 * 60,
    )
    expect(view.rows[1]!.time).toBe('٠٤:٥٠')
    expect(view.masihi).toContain('٢٠٢٦')
  })
})

describe('i18n', () => {
  it('resolves keys and interpolates', () => {
    expect(t('en', 'notification.due', { prayer: 'Asar' })).toBe(
      'It is time for Asar',
    )
    expect(t('ms', 'missing.key')).toBe('missing.key')
  })

  it('marks Arabic-script locales as right-to-left', () => {
    expect(isRtl('ar')).toBe(true)
    expect(isRtl('ms-Arab')).toBe(true)
    expect(isRtl('ms')).toBe(false)
    expect(isRtl('en')).toBe(false)
  })
})

describe('mementoCache', () => {
  it('reads and writes strings through the editor memento', async () => {
    const store = new Map<string, unknown>()
    const memento: MementoLike = {
      get: <T,>(key: string, fallback?: T) =>
        (store.has(key) ? store.get(key) : fallback) as T | undefined,
      update: async (key, value) => {
        store.set(key, value)
      },
    }
    const cache = mementoCache(memento)
    expect(await cache.get('missing')).toBeNull()
    await cache.set('wsb.day.v3.2026-10-18:bruneiMuara', '{}')
    expect(await cache.get('wsb.day.v3.2026-10-18:bruneiMuara')).toBe('{}')
  })
})
