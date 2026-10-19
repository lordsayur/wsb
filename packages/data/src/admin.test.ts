import { describe, expect, it } from 'vitest'
import {
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
    district: 'belait',
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
    expect(validateRecordEdit({ ...valid, district: 'mars' }).ok).toBe(false)
    expect(validateRecordEdit({ ...valid, prayer: 'lunch' }).ok).toBe(false)
    expect(validateRecordEdit({ ...valid, time: '99:99' }).ok).toBe(false)
    expect(validateRecordEdit(null).ok).toBe(false)
  })
})
