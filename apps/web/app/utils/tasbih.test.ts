import { describe, expect, it } from 'vitest'
import {
  TASBIH_DEFAULT_STEP,
  TASBIH_MAX,
  clampCount,
  clampStep,
  decrementCount,
  incrementCount,
  isMilestone,
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

// specs/web/spec.md — notifications fire on every multiple of the chosen step.
describe('tasbih milestone', () => {
  it('defaults the step to 100 and rejects bad steps', () => {
    expect(TASBIH_DEFAULT_STEP).toBe(100)
    expect(clampStep(33)).toBe(33)
    expect(clampStep(0)).toBe(1)
    expect(clampStep(2.9)).toBe(2)
    expect(clampStep(Number.NaN)).toBe(TASBIH_DEFAULT_STEP)
  })

  it('rings on each multiple of the step, never at zero', () => {
    expect(isMilestone(100, 100)).toBe(true)
    expect(isMilestone(200, 100)).toBe(true)
    expect(isMilestone(150, 100)).toBe(false)
    expect(isMilestone(33, 33)).toBe(true)
    expect(isMilestone(66, 33)).toBe(true)
    expect(isMilestone(99, 33)).toBe(true)
    expect(isMilestone(34, 33)).toBe(false)
    expect(isMilestone(0, 33)).toBe(false)
  })
})
