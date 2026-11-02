import { describe, expect, it } from 'vitest'
import type { PrayerEntry } from '@wsb/core'
import { segmentProgress } from './progress'

const entries: PrayerEntry[] = [
  { prayer: 'imsak', minutes: 280 },
  { prayer: 'subuh', minutes: 290 },
  { prayer: 'syuruk', minutes: 350 },
]

// specs/web/spec.md — summary hero progress runs from one entry to the next.
describe('segmentProgress', () => {
  it('is zero at the current entry', () => {
    expect(
      segmentProgress(entries, {
        current: 'subuh',
        next: 'syuruk',
        minutesToNext: 60,
        secondsToNext: 3600,
      }),
    ).toBe(0)
  })

  it('is half-way halfway through the interval', () => {
    expect(
      segmentProgress(entries, {
        current: 'subuh',
        next: 'syuruk',
        minutesToNext: 30,
        secondsToNext: 1800,
      }),
    ).toBe(0.5)
  })

  it('starts at midnight before the first entry', () => {
    expect(
      segmentProgress(entries, {
        current: null,
        next: 'imsak',
        minutesToNext: 140,
        secondsToNext: 140 * 60,
      }),
    ).toBe(0.5)
  })

  it('clamps and tolerates empty input', () => {
    expect(
      segmentProgress(entries, {
        current: 'syuruk',
        next: 'imsak',
        minutesToNext: 0,
        secondsToNext: 0,
      }),
    ).toBe(1)
    expect(
      segmentProgress([], {
        current: null,
        next: 'imsak',
        minutesToNext: 0,
        secondsToNext: 0,
      }),
    ).toBe(0)
  })
})
