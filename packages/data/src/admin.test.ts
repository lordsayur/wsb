import { describe, expect, it } from 'vitest'
import {
  adminEditKey,
  adminMonthDays,
  adminPendingRecords,
  applyAdminEdits,
  isIsoDate,
  isMonth,
  normalizeTimeInput,
  validateRecordEdit,
} from './admin.js'

// specs/data/spec.md — admin import/correction validation.
describe('isMonth', () => {
  it('accepts YYYY-MM only', () => {
    expect(isMonth('2026-10')).toBe(true)
    expect(isMonth('2026-13')).toBe(false)
    expect(isMonth('2026-1')).toBe(false)
    expect(isMonth(202610)).toBe(false)
  })
})

describe('isIsoDate', () => {
  it('accepts real calendar dates', () => {
    expect(isIsoDate('2026-10-18')).toBe(true)
    expect(isIsoDate('2028-02-29')).toBe(true)
  })

  it('rejects impossible or malformed dates', () => {
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
    expect(isIsoDate('18-10-2026')).toBe(false)
    expect(isIsoDate(undefined)).toBe(false)
  })
})

describe('normalizeTimeInput', () => {
  it('accepts HH:mm and HH:mm:ss', () => {
    expect(normalizeTimeInput('04:51')).toBe('04:51:00')
    expect(normalizeTimeInput('04:51:30')).toBe('04:51:30')
    expect(normalizeTimeInput(' 23:59 ')).toBe('23:59:00')
  })

  it('rejects out-of-range or malformed times', () => {
    expect(normalizeTimeInput('24:00')).toBeNull()
    expect(normalizeTimeInput('04:60')).toBeNull()
    expect(normalizeTimeInput('4:51')).toBeNull()
    expect(normalizeTimeInput('soon')).toBeNull()
  })
})

describe('validateRecordEdit', () => {
  const valid = {
    prayerDate: '2026-10-18',
    prayer: 'asar',
    time: '15:23',
    hijriDate: '7 Jamadilawal 1448 H',
  }

  it('normalizes a valid edit', () => {
    expect(validateRecordEdit(valid)).toEqual({
      ok: true,
      value: { ...valid, time: '15:23:00' },
    })
  })

  it('defaults a missing Hijri date to empty', () => {
    const result = validateRecordEdit({ ...valid, hijriDate: undefined })
    expect(result.ok && result.value.hijriDate).toBe('')
  })

  it('rejects every invalid field without throwing', () => {
    expect(validateRecordEdit({ ...valid, prayerDate: 'x' }).ok).toBe(false)
    expect(validateRecordEdit({ ...valid, prayer: 'lunch' }).ok).toBe(false)
    expect(validateRecordEdit({ ...valid, time: '99:99' }).ok).toBe(false)
    expect(validateRecordEdit(null).ok).toBe(false)
  })
})

describe('adminEditKey', () => {
  it('keys a cell by date and prayer', () => {
    expect(adminEditKey('2026-10-18', 'asar')).toBe('2026-10-18:asar')
  })
})

describe('applyAdminEdits', () => {
  const days = adminMonthDays([
    { prayerDate: '2026-10-18', prayer: 'asar', time: '15:31:00', hijriDate: '7 H' },
    { prayerDate: '2026-10-18', prayer: 'zuhur', time: '12:16:00', hijriDate: '7 H' },
  ])

  it('overlays staged times without touching stored rows', () => {
    const next = applyAdminEdits(days, { '2026-10-18:asar': '15:35:00' })
    expect(next[0]!.times.asar).toBe('15:35:00')
    expect(next[0]!.times.zuhur).toBe('12:16:00')
    expect(days[0]!.times.asar).toBe('15:31:00')
  })

  it('ignores edits for days not in the month', () => {
    const next = applyAdminEdits(days, { '2026-11-01:asar': '15:35:00' })
    expect(next).toEqual(days)
  })
})

describe('adminPendingRecords', () => {
  const days = adminMonthDays([
    { prayerDate: '2026-10-18', prayer: 'asar', time: '15:31:00', hijriDate: '7 H' },
    { prayerDate: '2026-10-19', prayer: 'zuhur', time: '12:17:00', hijriDate: '8 H' },
  ])

  it('emits one upsert record per staged cell with the day Hijri date', () => {
    const records = adminPendingRecords(days, {
      '2026-10-18:asar': '15:35:00',
      '2026-10-19:zuhur': '12:20:00',
    })
    expect(records).toEqual([
      {
        prayerDate: '2026-10-18',
        prayer: 'asar',
        time: '15:35:00',
        hijriDate: '7 H',
      },
      {
        prayerDate: '2026-10-19',
        prayer: 'zuhur',
        time: '12:20:00',
        hijriDate: '8 H',
      },
    ])
  })

  it('returns nothing when no cell is staged', () => {
    expect(adminPendingRecords(days, {})).toEqual([])
  })
})
