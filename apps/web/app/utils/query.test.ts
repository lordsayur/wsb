import { describe, expect, it } from 'vitest'
import {
  parseDate,
  parseDistrict,
  parseMonth,
  parseRange,
  queryValue,
} from './query'

// specs/web/spec.md — the address carries a page's selection; bad values fall
// back to the defaults instead of throwing.
describe('query selection', () => {
  it('reads the first value when a query key repeats', () => {
    expect(queryValue('month')).toBe('month')
    expect(queryValue(['day', 'month'])).toBe('day')
    expect(queryValue(undefined)).toBeNull()
    expect(queryValue(3)).toBeNull()
  })

  it('accepts real months and rejects the rest', () => {
    expect(parseMonth('2026-10')).toBe('2026-10')
    expect(parseMonth('2026-13')).toBeNull()
    expect(parseMonth('2026-1')).toBeNull()
    expect(parseMonth('October')).toBeNull()
  })

  it('accepts real calendar dates only', () => {
    expect(parseDate('2026-10-21')).toBe('2026-10-21')
    expect(parseDate('2026-02-30')).toBeNull()
    expect(parseDate('2026-02-28')).toBe('2026-02-28')
    expect(parseDate('2026-10')).toBeNull()
  })

  it('accepts known districts and chart ranges', () => {
    expect(parseDistrict('tutong')).toBe('tutong')
    expect(parseDistrict('mars')).toBeNull()
    expect(parseRange('year')).toBe('year')
    expect(parseRange('decade')).toBeNull()
  })
})
