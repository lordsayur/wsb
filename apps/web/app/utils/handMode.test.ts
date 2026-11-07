import { describe, expect, it } from 'vitest'
import { DEFAULT_HAND_MODE, isHandMode, menuSide } from './handMode'

// specs/web/spec.md — hand mode decides which side the menu controls sit on.
describe('hand mode', () => {
  it('defaults to the right hand with the menu on the right', () => {
    expect(DEFAULT_HAND_MODE).toBe('right')
    expect(menuSide('right')).toBe('end')
  })

  it('puts the menu on the left for a left-handed reader', () => {
    expect(menuSide('left')).toBe('start')
  })

  it('accepts only the two modes', () => {
    expect(isHandMode('right')).toBe(true)
    expect(isHandMode('left')).toBe(true)
    expect(isHandMode('middle')).toBe(false)
    expect(isHandMode(undefined)).toBe(false)
  })
})
