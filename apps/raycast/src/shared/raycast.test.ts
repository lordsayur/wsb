import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import type { PrayerRepository, ReadResult } from '@wsb/data'
import { buildDayView, dayTitle } from './view.js'
import { resolveSettings } from './settings.js'
import { PRAYER_LABELS } from './strings.js'
import { loadDay, storeCache, type StringStore } from './day.js'

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
  it('defaults: 24h, default district', () => {
    expect(resolveSettings(undefined)).toEqual({
      timeFormat: '24h',
      district: 'bruneiMuara',
    })
  })

  it('falls back safely on unknown stored values', () => {
    expect(
      resolveSettings({ timeFormat: 'nope', district: 'mars' }),
    ).toEqual({ timeFormat: '24h', district: 'bruneiMuara' })
  })

  it('accepts 12-hour time', () => {
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
    expect(view.next).toBe('3h 10m until Asar')
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

  it('labels every prayer in English', () => {
    const view = buildDayView(day, resolveSettings(undefined), 0)
    expect(view.rows.map((row) => row.label)).toEqual([
      'Imsak',
      'Subuh',
      'Syuruk',
      'Dhuha',
      'Zuhur',
      'Asar',
      'Maghrib',
      'Isyak',
    ])
    expect(PRAYER_LABELS.zuhur).toBe('Zuhur')
  })

  it('titles the section with weekday, both dates and the duration to next', () => {
    const view = buildDayView(day, resolveSettings(undefined), 0)
    const title = dayTitle(view)
    expect(title).toContain(view.weekday)
    expect(title).toContain(view.masihi)
    expect(title).toContain(view.hijri)
    // The countdown the README promises must be on screen, not merely computed.
    expect(title).toContain(view.next)
  })
})

describe('strings', () => {
  it('keeps the interface US English with no lookup layer', () => {
    const view = buildDayView(day, resolveSettings(undefined), 0)
    expect(view.next).toMatch(/^\d+(h \d+m|m|s) until [A-Z]\w+$/)
  })
})

describe('loadDay', () => {
  /** A repository that always answers from the last known day. */
  function staleRepo(result: ReadResult): PrayerRepository {
    return {
      async read() {
        return result
      },
      async refresh() {
        return false
      },
      async readMonth() {
        return { status: 'unavailable' }
      },
      async getSelection() {
        return null
      },
      async setSelection() {},
    }
  }

  it('labels a stale day with the date its entries belong to', async () => {
    const loaded = await loadDay(
      staleRepo({
        status: 'ok',
        date: '2026-11-07',
        entries,
        hijriDate: 'hijri',
        stale: true,
      }),
    )
    expect(loaded?.date).toBe('2026-11-07')
    expect(loaded?.stale).toBe(true)
  })

  it('reports whether a forced reload actually refreshed', async () => {
    const loaded = await loadDay(
      staleRepo({
        status: 'ok',
        date: '2026-11-07',
        entries,
        hijriDate: 'hijri',
        stale: true,
      }),
      true,
    )
    expect(loaded?.refreshed).toBe(false)
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
