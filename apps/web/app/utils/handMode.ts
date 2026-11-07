// specs/web/spec.md — hand mode: which side the menu controls sit on. Pure data
// and validation, no framework.

export type HandMode = 'right' | 'left'

export const DEFAULT_HAND_MODE: HandMode = 'right'

export function isHandMode(value: unknown): value is HandMode {
  return value === 'right' || value === 'left'
}

/** The inline side the menu controls sit on for a given hand mode. */
export function menuSide(handMode: HandMode): 'start' | 'end' {
  return handMode === 'left' ? 'start' : 'end'
}
