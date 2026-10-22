// specs/tui/spec.md — one palette for the terminal. The same per-prayer colours
// the web shell uses, expressed as 24-bit ANSI so the two shells look alike.
import type { PrayerName } from '@wsb/core'

export type Rgb = readonly [number, number, number]

export const PRAYER_RGB: Record<PrayerName, Rgb> = {
  imsak: [148, 163, 184],
  subuh: [56, 189, 248],
  syuruk: [245, 158, 11],
  doha: [251, 191, 36],
  zuhur: [52, 211, 153],
  asar: [167, 139, 250],
  maghrib: [251, 113, 133],
  isyak: [96, 165, 250],
}

/** The shell's single accent, used for tabs, rules and the active row. */
export const ACCENT: Rgb = [56, 189, 248]
export const MUTED: Rgb = [120, 132, 148]

export const RESET = '\u001b[0m'
export const BOLD = '\u001b[1m'
export const DIM = '\u001b[2m'
export const REVERSE = '\u001b[7m'

export function fg(rgb: Rgb): string {
  return `\u001b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
}

export function prayerRgb(prayer: PrayerName): Rgb {
  return PRAYER_RGB[prayer] ?? MUTED
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

/** Wraps text in a colour and a style, or returns it untouched when plain. */
export function colorize(
  text: string,
  options: { color?: boolean; rgb?: Rgb; bold?: boolean; dim?: boolean; reverse?: boolean },
): string {
  if (!options.color) return text
  let prefix = ''
  if (options.rgb) prefix += fg(options.rgb)
  if (options.bold) prefix += BOLD
  if (options.dim) prefix += DIM
  if (options.reverse) prefix += REVERSE
  return prefix ? `${prefix}${text}${RESET}` : text
}

/** The 24-bit colour for a prayer, matching the web chart. */
export function prayerHex(prayer: PrayerName): string {
  const [r, g, b] = prayerRgb(prayer)
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`
}
