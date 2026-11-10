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

const SUN_COLOR = '#ffe5b4'
const MOON_COLOR = '#a3c1ff'
const SUN_INTENSITY = 2.4
const MOON_INTENSITY = 0.9

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
