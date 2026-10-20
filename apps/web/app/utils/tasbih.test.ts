import { describe, expect, it } from 'vitest'
import {
  TASBIH_MAX,
  clampCount,
  decrementCount,
  incrementCount,
} from './tasbih'

// specs/web/spec.md — the tasbih count never goes below zero or past the cap.
describe('tasbih count', () => {
  it('increments and resets through zero', () => {
    expect(incrementCount(0)).toBe(1)
    expect(incrementCount(108)).toBe(109)
    expect(decrementCount(1)).toBe(0)
    expect(decrementCount(0)).toBe(0)
  })

  it('caps at the maximum and clamps bad values', () => {
    expect(incrementCount(TASBIH_MAX)).toBe(TASBIH_MAX)
    expect(clampCount(-4)).toBe(0)
    expect(clampCount(3.9)).toBe(3)
    expect(clampCount(Number.NaN)).toBe(0)
  })
})
