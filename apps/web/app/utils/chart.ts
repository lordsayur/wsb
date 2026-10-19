// specs/web/spec.md — chart scale helpers. Pure geometry, no domain rules.

export interface AxisTick {
  value: number
  label: string
}

/** Rounds a minute domain to readable bounds and picks a tick step. */
export function minuteAxis(minutes: readonly number[]): {
  min: number
  max: number
  step: number
} {
  if (minutes.length === 0) return { min: 0, max: 1440, step: 240 }
  const low = Math.min(...minutes)
  const high = Math.max(...minutes)
  const min = Math.max(0, Math.floor((low - 10) / 30) * 30)
  const max = Math.min(1440, Math.ceil((high + 10) / 30) * 30)
  const span = Math.max(max - min, 60)
  const step = span > 600 ? 120 : span > 240 ? 60 : 30
  return { min, max, step }
}

/** Tick values from `min` to `max` inclusive, stepping by `step`. */
export function axisTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  for (let value = min; value <= max; value += step) ticks.push(value)
  return ticks
}

/** Reduces a list to at most `count` evenly spaced indices, always including the ends. */
export function sampleIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, index) => index)
  const indices = new Set<number>()
  for (let i = 0; i < count; i += 1) {
    indices.add(Math.round((i * (length - 1)) / (count - 1)))
  }
  return [...indices].sort((a, b) => a - b)
}

/** Stable per-prayer line colours that read on both themes. */
export const PRAYER_COLORS: Record<string, string> = {
  imsak: '#94a3b8',
  subuh: '#38bdf8',
  syuruk: '#f59e0b',
  doha: '#fbbf24',
  zuhur: '#34d399',
  asar: '#a78bfa',
  maghrib: '#fb7185',
  isyak: '#60a5fa',
}

export function prayerColor(prayer: string): string {
  return PRAYER_COLORS[prayer] ?? '#94a3b8'
}

/** Maps a value in [min, max] to a y pixel (top-down). */
export function scaleY(value: number, min: number, max: number, height: number): number {
  if (max === min) return height / 2
  return height - ((value - min) / (max - min)) * height
}

/** Maps an index in [0, count - 1] to an x pixel. */
export function scaleX(index: number, count: number, width: number): number {
  if (count <= 1) return width / 2
  return (index / (count - 1)) * width
}

/** Builds an SVG path through the non-null points, breaking at gaps. */
export function seriesPath(
  values: readonly (number | null)[],
  count: number,
  width: number,
  height: number,
  min: number,
  max: number,
): string {
  let path = ''
  let open = false
  values.forEach((value, index) => {
    if (value === null) {
      open = false
      return
    }
    const x = scaleX(index, count, width)
    const y = scaleY(value, min, max, height)
    path += `${open ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    open = true
  })
  return path
}
