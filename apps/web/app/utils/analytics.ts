// specs/web/spec.md — analytics panel math, kept out of the component.
import type { AnalyticsDay } from '~/composables/useAnalytics'

/** Percentage change from `previous` to `current`; null when there is no base. */
export function changePercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

/** Bar heights as a percentage of the busiest day, for an inline SVG chart. */
export function barHeights(days: AnalyticsDay[]): number[] {
  const peak = Math.max(0, ...days.map((day) => day.views))
  if (peak === 0) return days.map(() => 0)
  return days.map((day) => Math.round((day.views / peak) * 100))
}
