// specs/web/spec.md — how far the current prayer interval has run, for the
// summary hero's progress bar. Presentation only; core still owns the times.
import {
  PRAYER_ORDER,
  wrapSeconds,
  type PrayerEntry,
  type PrayerProgress,
} from '@wsb/core'

const DAY_SECONDS = 24 * 60 * 60

/** 0 at the current entry, 1 at the next one; 0 when there is no interval. */
export function segmentProgress(
  entries: readonly PrayerEntry[],
  progress: PrayerProgress,
): number {
  const ordered = PRAYER_ORDER.map((prayer) =>
    entries.find((entry) => entry.prayer === prayer),
  ).filter((entry): entry is PrayerEntry => entry !== undefined)
  const next = ordered.find((entry) => entry.prayer === progress.next)
  if (!next) return 0

  const current = progress.current
    ? ordered.find((entry) => entry.prayer === progress.current)
    : undefined
  // Before the day's first entry the interval started at midnight.
  const interval = current
    ? wrapSeconds(next.minutes * 60 - current.minutes * 60) || DAY_SECONDS
    : next.minutes * 60
  if (interval <= 0) return 0

  const elapsed = interval - progress.secondsToNext
  return Math.min(1, Math.max(0, elapsed / interval))
}
