import { describe, expect, it } from 'vitest'
import { DIGIT_SEGMENTS, displayDigits, segmentsFor } from './segments'

// specs/web/spec.md — the digital display maps every digit to real segments.
describe('seven-segment display', () => {
  it('covers every digit and gives 8 all seven segments', () => {
    expect(Object.keys(DIGIT_SEGMENTS).sort()).toEqual([...'0123456789'])
    expect(segmentsFor('8')).toHaveLength(7)
    expect(segmentsFor('0')).not.toContain('g')
    expect(segmentsFor('?')).toEqual([])
  })

  it('pads and clamps the counter to the display width', () => {
    expect(displayDigits(0)).toEqual(['0', '0', '0', '0'])
    expect(displayDigits(42)).toEqual(['0', '0', '4', '2'])
    expect(displayDigits(9_999)).toEqual(['9', '9', '9', '9'])
    expect(displayDigits(12_345)).toEqual(['9', '9', '9', '9'])
  })
})
