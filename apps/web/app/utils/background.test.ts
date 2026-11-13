import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BACKGROUND,
  coverRepeat,
  isBackgroundStyle,
  lightSway,
  railRepeats,
  tiltDrift,
  wallLight,
} from './background'

// specs/web/spec.md — the summary backdrop's sun/moon cycle and texture cover.
describe('background choice', () => {
  it('defaults to the wall and accepts only the two looks', () => {
    expect(DEFAULT_BACKGROUND).toBe('wall')
    expect(isBackgroundStyle('wall')).toBe(true)
    expect(isBackgroundStyle('aurora')).toBe(true)
    expect(isBackgroundStyle('video')).toBe(false)
    expect(isBackgroundStyle(undefined)).toBe(false)
  })
})

describe('wall light', () => {
  it('is the sun through the day and the moon at night', () => {
    expect(wallLight(6).kind).toBe('sun')
    expect(wallLight(12).kind).toBe('sun')
    expect(wallLight(17.99).kind).toBe('sun')
    expect(wallLight(18).kind).toBe('moon')
    expect(wallLight(0).kind).toBe('moon')
    expect(wallLight(5.99).kind).toBe('moon')
  })

  it('puts the sun overhead at noon and the moon overhead at midnight', () => {
    const noon = wallLight(12)
    expect(noon.position[0]).toBeCloseTo(0)
    expect(noon.position[1]).toBeCloseTo(2.6)

    const midnight = wallLight(0)
    expect(midnight.position[0]).toBeCloseTo(0)
    expect(midnight.position[1]).toBeCloseTo(2.2)
  })

  it('moves the sun from one side to the other across the day', () => {
    expect(wallLight(6.5).position[0]).toBeLessThan(0)
    expect(wallLight(17.5).position[0]).toBeGreaterThan(0)
  })

  it('keeps the body above the wall all day', () => {
    for (let hour = 0; hour < 24; hour += 0.5) {
      expect(wallLight(hour).position[1]).toBeGreaterThan(0)
    }
  })

  it('warms the day and cools the night', () => {
    expect(wallLight(10).color).toBe('#ffe5b4')
    expect(wallLight(22).color).toBe('#a3c1ff')
    expect(wallLight(10).intensity).toBeGreaterThan(wallLight(22).intensity)
  })
})

describe('cover repeat', () => {
  it('crops a wide texture sideways on a tall plane', () => {
    const { repeat, offset } = coverRepeat(0.5, 2)
    expect(repeat).toEqual([0.25, 1])
    expect(offset).toEqual([0.375, 0])
  })

  it('crops a tall texture vertically on a wide plane', () => {
    const { repeat, offset } = coverRepeat(3, 1)
    expect(repeat).toEqual([1, 1 / 3])
    expect(offset[0]).toBe(0)
    expect(offset[1]).toBeCloseTo(1 / 3)
  })

  it('leaves a matching aspect untouched', () => {
    expect(coverRepeat(1.5, 1.5).repeat).toEqual([1, 1])
  })
})

describe('rail repeats', () => {
  it('repeats a grain strip along a long board, one tile per grain length', () => {
    expect(railRepeats(12, 1.2)).toBe(10)
  })

  it('never asks for a fraction of a repeat', () => {
    expect(railRepeats(0.4, 1.2)).toBe(1)
    expect(railRepeats(4.7, 1.2)).toBe(4)
  })
})

describe('tilt drift', () => {
  it('is still in the pose it calibrated in', () => {
    expect(tiltDrift(40, 0, 40, 0)).toEqual({ x: 0, y: 0 })
  })

  it('reads gamma as left/right and beta as front/back when upright', () => {
    expect(tiltDrift(40, 30, 40, 0, false, 30)).toEqual({ x: 1, y: 0 })
    expect(tiltDrift(10, 0, 40, 0, false, 30)).toEqual({ x: 0, y: -1 })
  })

  it('swaps the axes when the screen is landscape', () => {
    expect(tiltDrift(70, 0, 40, 0, true, 30)).toEqual({ x: 1, y: 0 })
    expect(tiltDrift(40, 30, 40, 0, true, 30)).toEqual({ x: 0, y: -1 })
  })

  it('clamps a big tilt to full drift', () => {
    expect(tiltDrift(180, 180, 0, 0, false, 30)).toEqual({ x: 1, y: 1 })
    expect(tiltDrift(-180, -180, 0, 0, false, 30)).toEqual({ x: -1, y: -1 })
  })
})

describe('light sway', () => {
  it('follows the drift and stays clamped', () => {
    expect(lightSway(0, 0)).toEqual([0, 0, 0])
    expect(lightSway(1, 1, 0.9)).toEqual([0.9, 0.54, 0])
    expect(lightSway(-4, 4, 0.9)).toEqual([-0.9, 0.54, 0])
  })
})
