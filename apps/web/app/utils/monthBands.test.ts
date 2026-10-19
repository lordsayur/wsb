import { describe, expect, it } from 'vitest'
import { weekBand } from './monthBands'

// specs/web/spec.md — calendar weeks alternate row backgrounds.
describe('weekBand', () => {
  it('keeps every day of a Monday-first week in the same band', () => {
    expect(weekBand('2026-10-01')).toBe(weekBand('2026-10-04'))
    expect(weekBand('2026-10-05')).toBe(weekBand('2026-10-11'))
  })

  it('alternates from one week to the next', () => {
    expect(weekBand('2026-10-04')).not.toBe(weekBand('2026-10-05'))
    expect(weekBand('2026-10-11')).not.toBe(weekBand('2026-10-12'))
  })

  it('bands a month that starts mid-week by calendar week', () => {
    expect(weekBand('2026-09-30')).toBe(0)
    expect(weekBand('2026-10-04')).toBe(0)
    expect(weekBand('2026-10-05')).toBe(1)
  })
})
