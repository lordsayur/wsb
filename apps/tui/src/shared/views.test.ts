import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { buildMonthView, chooseMonthColumns } from './month.js'
import { buildTrendView, sample, sparkline } from './trend.js'
import { resolveSettings } from './settings.js'
import {
  fitParts,
  renderFrame,
  renderMonthFrame,
  renderTrendFrame,
  visibleWidth,
} from './render.js'
import { buildDayView } from './view.js'

// specs/tui/spec.md — acceptance criteria for the month/trend views and the
// full-screen, coloured frame. Pure parts only.
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

const days = Array.from({ length: 31 }, (_, index) => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  entries: entries.map((entry) => ({
    prayer: entry.prayer,
    minutes: entry.minutes + index,
  })),
  hijriDate: '1 Jamadilawal 1448 H',
}))

const settings = resolveSettings(undefined)
const baseOptions = {
  columns: 80,
  rows: 24,
  showHelp: false,
  unavailable: false,
  loading: false,
  source: 'KHEU',
  color: true,
}

describe('full-screen frame', () => {
  const day = { date: '2026-10-02', entries, hijriDate: '1 Jamadilawal 1448 H' }
  const view = buildDayView(day, settings, 12 * 60 * 60 + 10 * 60)

  it('fills exactly the requested rows and columns', () => {
    const lines = renderFrame(view, settings, baseOptions)
    expect(lines).toHaveLength(24)
    expect(lines.every((line) => visibleWidth(line) === 80)).toBe(true)
  })

  it('adapts to a resized terminal', () => {
    const lines = renderFrame(view, settings, { ...baseOptions, columns: 120, rows: 40 })
    expect(lines).toHaveLength(40)
    expect(lines.every((line) => visibleWidth(line) === 120)).toBe(true)
  })

  it('uses 24-bit colour for the current entry', () => {
    const text = renderFrame(view, settings, baseOptions).join('\n')
    expect(text).toContain('\u001b[38;2;52;211;153m')
  })

  it('never leaves an escape sequence unterminated when clipping', () => {
    for (const columns of [20, 24, 30, 40, 60]) {
      const lines = renderFrame(view, settings, { ...baseOptions, columns })
      for (const line of lines) {
        expect(visibleWidth(line)).toBe(columns)
        const stripped = line.replace(/\u001b\[[0-9;]*m/g, '')
        expect(stripped).not.toContain('\u001b')
        expect(stripped).not.toContain('\u001b[0')
      }
    }
  })

  it('drops whole footer parts instead of cutting them', () => {
    expect(fitParts(['a', 'b', 'c'], 100)).toBe('a  ·  b  ·  c')
    expect(fitParts(['aaaa', 'bbbb', 'cccc'], 14)).toBe('aaaa  ·  bbbb')
    expect(fitParts(['aaaa', 'bbbb'], 2)).toBe('aaaa')
  })

  it('emits no escapes without colour', () => {
    const text = renderFrame(view, settings, { ...baseOptions, color: false }).join('\n')
    expect(text).not.toContain('\u001b')
  })
})

describe('month view', () => {
  it('builds one row per day with all eight columns', () => {
    const view = buildMonthView(days, '2026-10', {
      settings,
      today: '2026-10-02',
      nowSeconds: 12 * 60 * 60 + 10 * 60,
    })
    expect(view.rows).toHaveLength(31)
    expect(view.columns.map((column) => column.prayer)).toEqual([
      'imsak',
      'subuh',
      'syuruk',
      'doha',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
    expect(view.rows[1]!.today).toBe(true)
    expect(view.rows[1]!.cells.filter((cell) => cell.current)).toHaveLength(1)
  })

  it('applies the district offset', () => {
    const belait = { ...settings, district: 'belait' as const }
    const view = buildMonthView(days, '2026-10', { settings: belait })
    expect(view.rows[0]!.cells[1]!.time).toBe('04:53')
  })

  it('renders a full frame with the month tab active', () => {
    const view = buildMonthView(days, '2026-10', { settings, today: '2026-10-02' })
    const lines = renderMonthFrame(view, settings, baseOptions)
    expect(lines).toHaveLength(24)
    expect(lines.every((line) => visibleWidth(line) === 80)).toBe(true)
    expect(lines.join('\n')).toContain('2 Bulan')
  })

  it('keeps the fard entries when the width is short', () => {
    const columns = buildMonthView(days, '2026-10', { settings }).columns
    expect(chooseMonthColumns(columns, 8)).toHaveLength(8)
    expect(chooseMonthColumns(columns, 5).map((column) => column.prayer)).toEqual([
      'subuh',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
    expect(chooseMonthColumns(columns, 6).map((column) => column.prayer)).toEqual([
      'imsak',
      'subuh',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
    expect(chooseMonthColumns(columns, 7).map((column) => column.prayer)).toEqual([
      'imsak',
      'subuh',
      'syuruk',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
  })

  it('hints at hidden columns on a narrow terminal', () => {
    const view = buildMonthView(days, '2026-10', { settings })
    const text = renderMonthFrame(view, settings, { ...baseOptions, columns: 50 }).join('\n')
    expect(text).toContain('+3')
    expect(text).toContain('Isyak')
    expect(text).not.toContain('Imsak')
  })

  it('scrolls without changing the frame size', () => {
    const view = buildMonthView(days, '2026-10', { settings })
    const top = renderMonthFrame(view, settings, baseOptions).join('\n')
    const scrolled = renderMonthFrame(view, settings, {
      ...baseOptions,
      monthScroll: 5,
    }).join('\n')
    expect(scrolled).not.toBe(top)
    expect(scrolled.split('\n')).toHaveLength(24)
  })
})

describe('trend view', () => {
  it('samples and draws a sparkline', () => {
    expect(sample([1, 2, 3, 4], 2)).toEqual([2, 4])
    expect(sparkline([1, 2, 3], 3)).toHaveLength(3)
    expect(sparkline([], 4)).toBe('')
    expect(sparkline([5, 5, 5], 3)).toBe('▄▄▄')
  })

  it('reports the low and high bounds per entry', () => {
    const view = buildTrendView(days, '2026-10', settings, 30)
    const subuh = view.rows.find((row) => row.prayer === 'subuh')!
    expect(subuh.low).toBe('04:50')
    expect(subuh.high).toBe('05:20')
    expect(subuh.spark).toHaveLength(30)
  })

  it('sheds optional rows on a short terminal and says so', () => {
    const view = buildTrendView(days, '2026-10', settings, 20)
    const lines = renderTrendFrame(view, settings, { ...baseOptions, rows: 15 })
    const text = lines.join('\n')
    expect(text).toContain('+3')
    expect(text).toContain('Isyak')
    expect(text).not.toContain('Imsak')
    expect(lines).toHaveLength(15)
  })

  it('renders a full frame with the trend tab active', () => {
    const view = buildTrendView(days, '2026-10', settings, 40)
    const lines = renderTrendFrame(view, settings, baseOptions)
    expect(lines).toHaveLength(24)
    expect(lines.every((line) => visibleWidth(line) === 80)).toBe(true)
    expect(lines.join('\n')).toContain('3 Trend')
  })
})
