// specs/web/spec.md — the summary backdrop. Two looks: the 3D wall (default)
// and the CSS aurora that came before it. This module is pure: the choice type
// and the sun/moon maths, so the scene only draws what it is told.

export type BackgroundStyle = 'wall' | 'aurora'

export const BACKGROUNDS: BackgroundStyle[] = ['wall', 'aurora']

/** The wall is the default; the aurora stays one tap away in Settings. */
export const DEFAULT_BACKGROUND: BackgroundStyle = 'wall'

export function isBackgroundStyle(value: unknown): value is BackgroundStyle {
  return value === 'wall' || value === 'aurora'
}

export interface WallLight {
  /** Which body is up. */
  kind: 'sun' | 'moon'
  color: string
  intensity: number
  /** Directional light position, in wall units. */
  position: [number, number, number]
}

/** Shallow field of view: the wall reads flat, like standing in front of it. */
export const WALL_FOV = 35
export const WALL_CAMERA_Z = 7.5
/** The wall overfills the frame, so parallax never reveals its edges. */
export const WALL_OVERSCAN = 1.08
/** The text band takes the top 60% of the frame; the tiles keep the rest. */
export const TEXT_SHARE = 0.6

/** The wooden dado rail that bridges the seam, in wall units. */
export const RAIL_HEIGHT = 0.085
/** The rail is a squashed half-cylinder: how far that half bulges forward. */
export const RAIL_DEPTH = 0.028
/** How deep the rail sinks into the wall, so its edges never z-fight. */
export const RAIL_BITE = 0.006
/** World length covered by one tile of the rail's grain texture. */
export const RAIL_GRAIN_LENGTH = 1.2

/**
 * How many times the rail's grain texture repeats along the wall, so a long
 * moulding keeps a natural grain scale instead of smearing one strip. Whole
 * tiles only: the tile is seamless along its length, so integer repeats join
 * invisibly.
 */
export function railRepeats(
  railWidth: number,
  grainLength: number = RAIL_GRAIN_LENGTH,
): number {
  return Math.max(1, Math.round(railWidth / Math.max(grainLength, 0.0001)))
}

const SUN_COLOR = '#ffe5b4'
const MOON_COLOR = '#a3c1ff'
const SUN_INTENSITY = 2.4
const MOON_INTENSITY = 0.9

/** How far the phone is tilted before the wall reaches its full drift, degrees. */
export const TILT_RANGE = 30

/** How far the lamp swings, in wall units, at the edge of the drift. */
export const LIGHT_SWAY = 0.9

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))
/** Negation turns 0 into -0, which is not the same number to a strict compare. */
const negate = (value: number) => (value === 0 ? 0 : -value)

/**
 * The wall drift for a device-orientation reading, as a share of the way to
 * full drift on each axis (-1..1). Measured against the pose the phone was held
 * in when it calibrated, so it works however the reader holds it, and the axes
 * swap when the screen is turned on its side.
 */
export function tiltDrift(
  beta: number,
  gamma: number,
  baselineBeta: number,
  baselineGamma: number,
  landscape = false,
  range: number = TILT_RANGE,
): { x: number; y: number } {
  const span = Math.max(range, 0.0001)
  const across = clampUnit((gamma - baselineGamma) / span)
  const along = clampUnit((beta - baselineBeta) / span)
  return landscape ? { x: along, y: negate(across) } : { x: across, y: along }
}

/**
 * Where the lamp sits for a drift: it travels with the view, so the light rakes
 * across the normals and the specular highlights slide as the reader moves.
 */
export function lightSway(
  x: number,
  y: number,
  sway: number = LIGHT_SWAY,
): [number, number, number] {
  return [clampUnit(x) * sway, clampUnit(y) * sway * 0.6, 0]
}

/**
 * The light for a local time: the sun arcs over the wall from 6 AM to 6 PM,
 * the moon over the other half of the day. `hours` is the local hour of day.
 */
export function wallLight(hours: number): WallLight {
  const local = ((hours % 24) + 24) % 24
  const day = local >= 6 && local < 18
  // 0 at the body's rise, 1 at its set.
  const progress = day ? (local - 6) / 12 : ((local + 6) % 12) / 12
  const angle = Math.PI * progress
  const reach = day ? 2.2 : 1.8
  return {
    kind: day ? 'sun' : 'moon',
    color: day ? SUN_COLOR : MOON_COLOR,
    intensity: day ? SUN_INTENSITY : MOON_INTENSITY,
    position: [
      -Math.cos(angle) * reach,
      Math.sin(angle) * reach + 0.4,
      1.6,
    ],
  }
}

export function wallLightAt(date: Date): WallLight {
  return wallLight(date.getHours() + date.getMinutes() / 60)
}

/**
 * UV repeat that makes a texture cover a plane of the given aspect without
 * stretching it: the wider side wins and the other is cropped, then centred.
 */
export function coverRepeat(
  planeAspect: number,
  textureAspect: number,
): { repeat: [number, number]; offset: [number, number] } {
  const plane = Math.max(planeAspect, 0.0001)
  const texture = Math.max(textureAspect, 0.0001)
  // The narrower axis keeps the whole texture; the wider one is cropped so the
  // visible texture share matches the plane, centred.
  const repeatX = plane < texture ? plane / texture : 1
  const repeatY = plane < texture ? 1 : texture / plane
  return {
    repeat: [repeatX, repeatY],
    offset: [(1 - repeatX) / 2, (1 - repeatY) / 2],
  }
}
