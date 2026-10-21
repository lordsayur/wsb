import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { buildDayView, dayTitle } from './view.js'
import { resolveSettings } from './settings.js'
import { t } from './i18n.js'
import { storeCache, type StringStore } from './day.js'

// specs/raycast/spec.md — shell formatting, settings and the device cache.
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
  it('defaults: Malay, 24h, default district', () => {
    expect(resolveSettings(undefined)).toEqual({
      locale: 'ms',
      timeFormat: '24h',
      district: 'bruneiMuara',
    })
  })

  it('falls back safely on unknown stored values', () => {
    expect(
      resolveSettings({ locale: 'fr', timeFormat: 'nope', district: 'mars' }),
    ).toEqual({ locale: 'ms', timeFormat: '24h', district: 'bruneiMuara' })
  })

  it('accepts the Arabic-script locales and 12-hour time', () => {
    expect(resolveSettings({ locale: 'ar' }).locale).toBe('ar')
    expect(resolveSettings({ locale: 'ms-Arab' }).locale).toBe('ms-Arab')
    expect(resolveSettings({ timeFormat: '12h' }).timeFormat).toBe('12h')
  })
})

describe('buildDayView', () => {
  it('renders eight labeled rows in order and marks the current entry', () => {
    const view = buildDayView(
      day,
      resolveSettings(undefined),
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

  it('applies the district offset (+1 for Tutong, +3 for Belait)', () => {
    const tutong = { ...resolveSettings(undefined), district: 'tutong' as const }
    const belait = { ...resolveSettings(undefined), district: 'belait' as const }
    expect(buildDayView(day, tutong, 0).rows[1]!.time).toBe('04:51')
    expect(buildDayView(day, belait, 0).rows[1]!.time).toBe('04:53')
  })

  it('marks the next entry and shows the duration to it', () => {
    const view = buildDayView(
      day,
      resolveSettings(undefined),
      12 * 60 * 60 + 10 * 60,
    )
    expect(view.nextPrayer).toBe('asar')
    expect(view.rows.filter((row) => row.next).map((row) => row.prayer)).toEqual([
      'asar',
    ])
    expect(view.next).toContain('3 jam 10 minit')
  })

  it('has no current entry before imsak, so imsak is next', () => {
    const view = buildDayView(day, resolveSettings(undefined), 60)
    expect(view.currentPrayer).toBeNull()
    expect(view.nextPrayer).toBe('imsak')
  })

  it('renders 12-hour times when chosen', () => {
    const view = buildDayView(day, { ...resolveSettings(undefined), timeFormat: '12h' }, 0)
    expect(view.rows[1]!.time).toMatch(/04:50\s?(PG|AM)/i)
  })

  it('uses Arabic-Indic digits for Arabic-script locales', () => {
    const view = buildDayView(
      day,
      { ...resolveSettings(undefined), locale: 'ar' },
      12 * 60 * 60 + 10 * 60,
    )
    expect(view.rows[1]!.time).toBe('٠٤:٥٠')
    expect(view.masihi).toContain('٢٠٢٦')
  })

  it('titles the section with weekday and both dates', () => {
    const view = buildDayView(day, resolveSettings(undefined), 0)
    expect(dayTitle(view)).toContain(view.weekday)
    expect(dayTitle(view)).toContain(view.masihi)
    expect(dayTitle(view)).toContain(view.hijri)
  })
})

describe('i18n', () => {
  it('resolves keys and interpolates', () => {
    expect(t('en', 'notification.due', { prayer: 'Asar' })).toBe(
      'It is time for Asar',
    )
    expect(t('ms', 'missing.key')).toBe('missing.key')
  })
})

describe('storeCache', () => {
  it('adapts a string store to the data port, including sync reads', async () => {
    const values = new Map<string, string>()
    const store: StringStore = {
      async getItem(key) {
        return values.get(key)
      },
      async setItem(key, value) {
        values.set(key, value)
      },
      getItemSync(key) {
        return values.get(key) ?? null
      },
    }
    const cache = storeCache(store)
    await cache.set('k', 'v')
    expect(await cache.get('k')).toBe('v')
    expect(cache.getSync?.('k')).toBe('v')
    expect(cache.getSync?.('missing')).toBeNull()
  })
})

describe('store export', () => {
  it('has no workspace-only imports or dependencies', async () => {
    const { readFile, readdir } = await import('node:fs/promises')
    const { join, dirname } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const root = join(dirname(fileURLToPath(import.meta.url)), '../../store/brunei-prayer-times')
    try {
      await readFile(join(root, 'package.json'))
    } catch {
      return // not exported in this checkout
    }
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    expect(manifest.dependencies).not.toHaveProperty('@wsb/core')
    expect(manifest.dependencies).not.toHaveProperty('@wsb/data')
    const files: string[] = []
    const walk = async (dir: string) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) await walk(path)
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(path)
      }
    }
    await walk(join(root, 'src'))
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      expect(source).not.toMatch(/@wsb\/|workspace:/)
    }
  })
})
