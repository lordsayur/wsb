import { describe, expect, it } from 'vitest'
import { stepIndex } from './rovingFocus'

describe('stepIndex', () => {
  it('wraps in both directions', () => {
    expect(stepIndex(0, 3, -1)).toBe(2)
    expect(stepIndex(2, 3, 1)).toBe(0)
    expect(stepIndex(1, 3, 1)).toBe(2)
  })

  it('enters at the matching end when nothing is focused', () => {
    expect(stepIndex(-1, 3, 1)).toBe(0)
    expect(stepIndex(-1, 3, -1)).toBe(2)
  })

  it('stays empty without items', () => {
    expect(stepIndex(0, 0, 1)).toBe(-1)
  })
})
