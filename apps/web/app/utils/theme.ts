// specs/web/spec.md — theme palettes. Pure data + validation, no framework.
export type ThemeMode = 'dark' | 'light'

export type PaletteId =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'rose'
  | 'violet'
  | 'custom'

export interface Palette {
  id: Exclude<PaletteId, 'custom'>
  color: string
}

export const DEFAULT_MODE: ThemeMode = 'dark'
export const DEFAULT_PALETTE: PaletteId = 'yellow'
export const DEFAULT_CUSTOM = '#facc15'

export const PALETTES: Palette[] = [
  { id: 'yellow', color: '#facc15' },
  { id: 'green', color: '#34d399' },
  { id: 'blue', color: '#60a5fa' },
  { id: 'rose', color: '#fb7185' },
  { id: 'violet', color: '#a78bfa' },
]

const HEX = /^#[0-9a-f]{6}$/i

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light'
}

export function isPaletteId(value: unknown): value is PaletteId {
  return value === 'custom' || PALETTES.some((palette) => palette.id === value)
}

export function normalizeHex(value: unknown): string | null {
  return typeof value === 'string' && HEX.test(value)
    ? value.toLowerCase()
    : null
}

export function resolvePrimary(palette: PaletteId, custom: string): string {
  if (palette === 'custom') return normalizeHex(custom) ?? DEFAULT_CUSTOM
  return PALETTES.find((p) => p.id === palette)?.color ?? PALETTES[0]!.color
}

export function readableOn(hex: string): string {
  const value = normalizeHex(hex) ?? DEFAULT_CUSTOM
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16))
  const luminance = (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255
  return luminance > 0.6 ? '#1c1917' : '#ffffff'
}
