import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { buildMonthView, chooseMonthColumns } from './month.js'
import {
  buildTrendView,
  minuteAxis,
  plotTrend,
  sampleIndices,
  trendDates,
} from './trend.js'
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
  it('uses the same axis rounding as the web chart', () => {
    expect(minuteAxis([])).toEqual({ min: 0, max: 1440, step: 240 })
    const axis = minuteAxis([4 * 60 + 41, 19 * 60 + 20])
    expect(axis.min % 30).toBe(0)
    expect(axis.max % 30).toBe(0)
    expect(axis.max).toBeGreaterThan(19 * 60 + 20)
  })

  it('samples x ticks and always includes both ends', () => {
    expect(sampleIndices(5, 6)).toEqual([0, 1, 2, 3, 4])
    const ticks = sampleIndices(365, 6)
    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBe(364)
    expect(ticks).toHaveLength(6)
  })

  it('builds one series per entry over the requested range', () => {
    const view = buildTrendView(days, settings, 'month', '2026-10-15')
    expect(view.series.map((line) => line.prayer)).toEqual([
      'imsak',
      'subuh',
      'syuruk',
      'doha',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
    expect(view.days).toBe(31)
    expect(view.yTicks.length).toBeGreaterThan(1)
    expect(view.xTicks).toHaveLength(6)
  })

  it('titles week, month and year ranges', () => {
    expect(buildTrendView(days, settings, 'month', '2026-10-15').title).toBe('Oktober 2026')
    expect(buildTrendView(days, settings, 'year', '2026-10-15').title).toBe('2026')
    expect(buildTrendView(days, settings, 'week', '2026-10-15').title).toContain('–')
  })

  it('covers every date the range spans', () => {
    expect(trendDates('2026-10-15', 'month')).toHaveLength(31)
    expect(trendDates('2026-10-15', 'year')).toHaveLength(365)
    expect(trendDates('2026-10-15', 'week')).toHaveLength(7)
  })

  it('plots overlapping braille lines inside the grid', () => {
    const view = buildTrendView(days, settings, 'month', '2026-10-15')
    const cells = plotTrend(view, 40, 10)
    expect(cells).toHaveLength(10)
    expect(cells.every((row) => row.length === 40)).toBe(true)
    expect(cells.flat().some((cell) => cell.bits > 0)).toBe(true)
    const painted = new Set(cells.flat().map((cell) => cell.prayer).filter(Boolean))
    expect(painted.size).toBeGreaterThan(1)
  })

  it('renders a full frame with the trend tab active', () => {
    const view = buildTrendView(days, settings, 'month', '2026-10-15')
    const lines = renderTrendFrame(view, settings, baseOptions)
    expect(lines).toHaveLength(24)
    expect(lines.every((line) => visibleWidth(line) === 80)).toBe(true)
    expect(lines.join('\n')).toContain('3 Trend')
  })

  it('keeps the frame size for week and year ranges', () => {
    for (const range of ['week', 'month', 'year'] as const) {
      const view = buildTrendView(days, settings, range, '2026-10-15')
      const lines = renderTrendFrame(view, settings, baseOptions)
      expect(lines).toHaveLength(24)
      expect(lines.every((line) => visibleWidth(line) === 80)).toBe(true)
    }
  })
})
