import { describe, expect, it } from 'vitest'
import { SWIPE_MAX, SWIPE_THRESHOLD, isSwipe, swipeOffset } from './useSwipe'

// specs/web/spec.md — horizontal swipe threshold and drag resistance.
describe('swipe', () => {
  it('counts a horizontal drag past the threshold only', () => {
    expect(isSwipe(SWIPE_THRESHOLD - 1, 0)).toBe(false)
    expect(isSwipe(SWIPE_THRESHOLD, 0)).toBe(true)
    expect(isSwipe(-SWIPE_THRESHOLD, 0)).toBe(true)
  })

  it('ignores vertical drags', () => {
    expect(isSwipe(SWIPE_THRESHOLD, SWIPE_THRESHOLD + 20)).toBe(false)
  })

  it('resists and clamps the drag offset', () => {
    expect(swipeOffset(100)).toBe(40)
    expect(swipeOffset(-100)).toBe(-40)
    expect(swipeOffset(10_000)).toBe(SWIPE_MAX)
    expect(swipeOffset(-10_000)).toBe(-SWIPE_MAX)
  })
})
