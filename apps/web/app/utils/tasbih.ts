// specs/web/spec.md — tasbih counter: whole numbers in [0, MAX], no negatives.
export const TASBIH_MAX = 9999

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
