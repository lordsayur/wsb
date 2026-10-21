// specs/web/spec.md — tasbih counter: whole numbers in [0, MAX], no negatives.
export const TASBIH_MAX = 9999
export const TASBIH_DEFAULT_STEP = 100

export function clampCount(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(TASBIH_MAX, Math.max(0, Math.trunc(value)))
}

export function incrementCount(value: number): number {
  return clampCount(value + 1)
}

export function decrementCount(value: number): number {
  return clampCount(value - 1)
}

/** A milestone step is a whole number in [1, MAX]; bad values fall back to the default. */
export function clampStep(value: number): number {
  if (!Number.isFinite(value)) return TASBIH_DEFAULT_STEP
  return Math.min(TASBIH_MAX, Math.max(1, Math.trunc(value)))
}

/** True when `value` lands exactly on a multiple of `step`, e.g. 66 with 33. */
export function isMilestone(value: number, step: number): boolean {
  return value > 0 && value % clampStep(step) === 0
}
