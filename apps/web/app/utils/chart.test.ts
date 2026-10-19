import { describe, expect, it } from 'vitest'
import {
  axisTicks,
  minuteAxis,
  sampleIndices,
  scaleX,
  scaleY,
  seriesPath,
} from './chart'

// specs/web/spec.md — chart geometry is pure and testable.
describe('minuteAxis', () => {
  it('pads the prayer-time domain and picks a readable step', () => {
    const axis = minuteAxis([280, 300, 700, 1150])
    expect(axis.min).toBe(270)
    expect(axis.max).toBe(1170)
    expect(axis.step).toBe(120)
  })

  it('falls back to a full day with no data', () => {
    expect(minuteAxis([])).toEqual({ min: 0, max: 1440, step: 240 })
  })
})

describe('axisTicks', () => {
  it('lists ticks inclusive of both bounds', () => {
    expect(axisTicks(0, 120, 60)).toEqual([0, 60, 120])
  })
})

describe('sampleIndices', () => {
  it('keeps the ends and spaces the rest evenly', () => {
    expect(sampleIndices(31, 6)).toEqual([0, 6, 12, 18, 24, 30])
    expect(sampleIndices(3, 6)).toEqual([0, 1, 2])
  })
})

describe('scaling', () => {
  it('maps the domain to the pixel box', () => {
    expect(scaleY(30, 0, 60, 100)).toBe(50)
    expect(scaleY(0, 0, 60, 100)).toBe(100)
    expect(scaleX(0, 3, 100)).toBe(0)
    expect(scaleX(2, 3, 100)).toBe(100)
  })
})

describe('seriesPath', () => {
  it('breaks the line at missing days', () => {
    const path = seriesPath([10, null, 20], 3, 100, 100, 0, 20)
    expect(path).toBe('M0.0 50.0M100.0 0.0')
  })
})
