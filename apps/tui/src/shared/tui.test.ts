import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { buildDayView, formatDuration } from './view.js'
import { resolveSettings, nextLocale, toggleTimeFormat } from './settings.js'
import { helpLine, jsonReport, nowReport, plainReport, renderFrame, visibleWidth } from './render.js'
import { splitKeys } from '../terminal.js'
import { cycleDistrict, parseArgs } from '../main.js'
import { fileStorage } from './state.js'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// specs/tui/spec.md — acceptance criteria for the shell (pure parts only).
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
  it('defaults: Malay, 24h, Brunei & Muara', () => {
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

  it('cycles locale and toggles the clock', () => {
    expect(nextLocale('ms')).toBe('ms-Arab')
    expect(nextLocale('en')).toBe('ms')
    expect(toggleTimeFormat('24h')).toBe('12h')
    expect(toggleTimeFormat('12h')).toBe('24h')
  })
})

describe('buildDayView', () => {
  it('renders eight labeled rows in order and marks current and next', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
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
    expect(view.rows.filter((row) => row.next).map((row) => row.prayer)).toEqual([
      'asar',
    ])
    expect(view.rows[1]!.time).toBe('04:50')
  })

  it('applies the district offset (+1 Tutong, +3 Belait)', () => {
    const tutong = { ...resolveSettings(undefined), district: 'tutong' as const }
    const belait = { ...resolveSettings(undefined), district: 'belait' as const }
    expect(buildDayView(day, tutong, 0).rows[1]!.time).toBe('04:51')
    expect(buildDayView(day, belait, 0).rows[1]!.time).toBe('04:53')
  })

  it('honours the 12-hour clock and the locale', () => {
    const settings = {
      ...resolveSettings(undefined),
      locale: 'en' as const,
      timeFormat: '12h' as const,
    }
    const view = buildDayView(day, settings, 0)
    expect(view.rows[4]!.time).toBe('12:05 PM')
    expect(view.rows[4]!.label).toBe('Zuhur')
  })

  it('formats the duration to the next entry', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
    expect(view.next).toContain('Asar')
  })
})

describe('formatDuration', () => {
  it('uses seconds, minutes and hours form', () => {
    expect(formatDuration(30, 'en')).toBe('30s')
    expect(formatDuration(5 * 60 + 20, 'en')).toBe('5m')
    expect(formatDuration(2 * 3600 + 7 * 60, 'en')).toBe('2h 7m')
  })
})

describe('render', () => {
  it('paints rows without escapes in the plain report', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
    const text = plainReport(view, resolveSettings(undefined), 'KHEU')
    expect(text).not.toContain('\u001b')
    expect(text.split('\n').filter((line) => line.includes('04:50'))).toHaveLength(1)
    expect(text).toContain('* 12:05  Zuhur')
  })

  it('emits one JSON object with the day and progress', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
    const payload = JSON.parse(jsonReport(view, resolveSettings(undefined)))
    expect(payload.date).toBe('2026-10-18')
    expect(payload.district).toBe('bruneiMuara')
    expect(payload.current).toBe('zuhur')
    expect(payload.next).toBe('asar')
    expect(payload.entries).toHaveLength(8)
  })

  it('prints the current entry and countdown for `now`', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
    const line = nowReport(view, resolveSettings(undefined))
    expect(line).toContain('Zuhur')
    expect(line).toContain('12:05')
    expect(line).toContain('Asar')
  })

  it('prints only the countdown before the first entry', () => {
    const view = buildDayView(day, resolveSettings(undefined), 0)
    const line = nowReport(view, resolveSettings(undefined))
    expect(line).not.toContain('·')
    expect(line).toContain('Imsak')
  })

  it('renders the full frame uncoloured and marks the current row', () => {
    const view = buildDayView(day, resolveSettings(undefined), 12 * 60 * 60 + 10 * 60)
    const lines = renderFrame(view, resolveSettings(undefined), {
      columns: 60,
      rows: 24,
      showHelp: false,
      unavailable: false,
      loading: false,
      source: 'KHEU',
      color: false,
    })
    expect(lines.some((line) => line.includes('▸'))).toBe(true)
    expect(lines.every((line) => visibleWidth(line) <= 60)).toBe(true)
  })

  it('shows the unavailable state when there is no day', () => {
    const lines = renderFrame(null, resolveSettings(undefined), {
      columns: 60,
      rows: 24,
      showHelp: false,
      unavailable: true,
      loading: false,
      source: 'KHEU',
    })
    expect(lines.join('\n')).toContain('tidak tersedia')
  })

  it('advertises the keys if asked', () => {
    expect(helpLine(resolveSettings(undefined), true)).toContain('keluar')
    expect(helpLine(resolveSettings(undefined), false)).toContain('kekunci')
  })
})

describe('arguments', () => {
  it('parses date, json, help and doctor', () => {
    expect(parseArgs([])).toEqual({
      json: false,
      now: false,
      update: false,
      apply: false,
      month: false,
      helpVersion: null,
    })
    expect(parseArgs(['now']).now).toBe(true)
    expect(parseArgs(['update']).update).toBe(true)
    expect(parseArgs(['update', '--apply']).apply).toBe(true)
    expect(parseArgs(['--month']).month).toBe(true)
    expect(parseArgs(['--json']).json).toBe(true)
    expect(parseArgs(['--date', '2026-01-02']).date).toBe('2026-01-02')
    expect(parseArgs(['--date=2026-01-03']).date).toBe('2026-01-03')
    expect(parseArgs(['--help']).helpVersion).toBe('help')
    expect(parseArgs(['--version']).helpVersion).toBe('version')
    expect(parseArgs(['doctor']).helpVersion).toBe('doctor')
  })

  it('cycles districts in order and wraps', () => {
    expect(cycleDistrict('bruneiMuara')).toBe('tutong')
    expect(cycleDistrict('tutong')).toBe('belait')
    expect(cycleDistrict('belait')).toBe('bruneiMuara')
  })
})

describe('terminal keys', () => {
  it('splits single keys and escape sequences', () => {
    expect(splitKeys('q')).toEqual(['q'])
    expect(splitKeys('\u001b')).toEqual(['\u001b'])
    expect(splitKeys('\u001b[A')).toEqual(['\u001b[A'])
    expect(splitKeys('dr')).toEqual(['d', 'r'])
  })
})

describe('state file', () => {
  it('round-trips values and reads a corrupt file as empty', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'wsb-tui-')), 'state.json')
    const storage = fileStorage(path)
    storage.setItem('a', '1')
    expect(storage.getItem('a')).toBe('1')
    expect(storage.getItem('missing')).toBeNull()
  })
})
