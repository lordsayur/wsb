// specs/web/spec.md — haptics: a short buzz where the device supports it.
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  navigator.vibrate(pattern)
}

export const INCREMENT_VIBRATION = 10
export const DECREMENT_VIBRATION = 10
export const RESET_VIBRATION = [20, 40, 20]
export const MILESTONE_VIBRATION = [40, 60, 40, 60, 40]
