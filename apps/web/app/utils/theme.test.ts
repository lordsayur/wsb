import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MODE,
  PALETTES,
  isPaletteId,
  isThemeMode,
  normalizeHex,
  readableOn,
  resolvePrimary,
} from './theme'

describe('theme utils', () => {
  it('defaults to dark and yellow', () => {
    expect(DEFAULT_MODE).toBe('dark')
    expect(resolvePrimary('yellow', '#000000')).toBe(PALETTES[0]!.color)
  })

  it('validates modes and palette ids', () => {
    expect(isThemeMode('light')).toBe(true)
    expect(isThemeMode('blue')).toBe(false)
    expect(isPaletteId('custom')).toBe(true)
    expect(isPaletteId('orange')).toBe(false)
  })

  it('normalizes and rejects hex colours', () => {
    expect(normalizeHex('#FACC15')).toBe('#facc15')
    expect(normalizeHex('yellow')).toBeNull()
    expect(normalizeHex('#fff')).toBeNull()
  })

  it('uses the custom colour, falling back when invalid', () => {
    expect(resolvePrimary('custom', '#7c3aed')).toBe('#7c3aed')
    expect(resolvePrimary('custom', 'nope')).toBe('#facc15')
  })

  it('picks a readable foreground', () => {
    expect(readableOn('#facc15')).toBe('#1c1917')
    expect(readableOn('#172554')).toBe('#ffffff')
  })
})
