// specs/core/spec.md — Prayer Times core domain.
// Pure TypeScript: no DOM, no network, no vendor types.

export type District = 'bruneiMuara' | 'tutong' | 'belait'

export type PrayerName =
  | 'subuh'
  | 'syuruk'
  | 'zuhur'
  | 'asar'
  | 'maghrib'
  | 'isyak'

export interface PrayerEntry {
  prayer: PrayerName
  /** Minutes since local midnight. */
  minutes: number
}

export interface PrayerTimes {
  /** Calendar date in ISO form (YYYY-MM-DD). */
  date: string
  district: District
  entries: PrayerEntry[]
}

export const DISTRICTS: readonly District[] = [
  'bruneiMuara',
  'tutong',
  'belait',
]

// specs/core/spec.md — legacy persisted value; Temburong has the same times.
export const LEGACY_DISTRICT_ALIASES: Readonly<Record<string, District>> = {
  temburong: 'bruneiMuara',
}

export const DEFAULT_DISTRICT: District = 'bruneiMuara'

export const PRAYER_ORDER: readonly PrayerName[] = [
  'subuh',
  'syuruk',
  'zuhur',
  'asar',
  'maghrib',
  'isyak',
]

const OFFSETS: Record<District, number> = {
  bruneiMuara: 0,
  tutong: 1,
  belait: 3,
}

const MINUTES_PER_DAY = 24 * 60
const SECONDS_PER_DAY = 24 * 60 * 60
const BRUNEI_OFFSET_MINUTES = 8 * 60

export interface PrayerProgress {
  /** The entry whose interval is active; null before today's first entry. */
  current: PrayerName | null
  next: PrayerName
  /** Whole minutes from now to the next entry; 0..1439. */
  minutesToNext: number
  /** Seconds from now to the next entry; 0..86399. */
  secondsToNext: number
}

/** Minutes before a prayer when a reminder is due. */
export const NOTIFICATION_LEAD_MINUTES = 15

export type PrayerNotificationKind = 'lead' | 'due'

export interface PrayerNotification {
  prayer: PrayerName
  kind: PrayerNotificationKind
  /** The prayer's time as minutes since Brunei midnight. */
  minutes: number
  /** Event time as seconds since Brunei midnight (may exceed one day). */
  atSeconds: number
  /** Seconds from the supplied now until the event. */
  secondsUntil: number
}

/**
 * Upcoming prayer reminders for the next 24 hours, nearest first: one lead
 * reminder `NOTIFICATION_LEAD_MINUTES` before each prayer and one at its time.
 * Syuruk is a time boundary, not a prayer, so it is excluded.
 */
export function notificationSchedule(
  entries: readonly PrayerEntry[],
  nowSeconds: number,
): PrayerNotification[] {
  const prayers = PRAYER_ORDER.map((prayer) =>
    entries.find((entry) => entry.prayer === prayer),
  ).filter(
    (entry): entry is PrayerEntry =>
      entry !== undefined && entry.prayer !== 'syuruk',
  )

  const events: PrayerNotification[] = []
  for (const entry of prayers) {
    const due = entry.minutes * 60
    for (const kind of ['lead', 'due'] as const) {
      let at = kind === 'lead' ? due - NOTIFICATION_LEAD_MINUTES * 60 : due
      while (at < nowSeconds) at += SECONDS_PER_DAY
      events.push({
        prayer: entry.prayer,
        kind,
        minutes: entry.minutes,
        atSeconds: at,
        secondsUntil: at - nowSeconds,
      })
    }
  }

  return events.sort((a, b) => a.secondsUntil - b.secondsUntil)
}

/** Brunei wall-clock date (YYYY-MM-DD) and elapsed time since midnight. */
export function bruneiNow(now: Date = new Date()): {
  date: string
  minutes: number
  seconds: number
} {
  const shifted = new Date(now.getTime() + BRUNEI_OFFSET_MINUTES * 60_000)
  const seconds =
    shifted.getUTCHours() * 3600 +
    shifted.getUTCMinutes() * 60 +
    shifted.getUTCSeconds()
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: Math.floor(seconds / 60),
    seconds,
  }
}

/** Splits a duration into whole hours, minutes and seconds for display. */
export function durationParts(seconds: number): {
  hours: number
  minutes: number
  seconds: number
} {
  const total = Math.max(0, Math.ceil(seconds))
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** Resolves the active interval: last entry passed, next entry, and duration. */
export function prayerProgress(
  entries: readonly PrayerEntry[],
  nowSeconds: number,
): PrayerProgress {
  const ordered = PRAYER_ORDER.map((prayer) =>
    entries.find((entry) => entry.prayer === prayer),
  ).filter((entry): entry is PrayerEntry => entry !== undefined)

  if (ordered.length === 0) {
    return {
      current: null,
      next: PRAYER_ORDER[0]!,
      minutesToNext: 0,
      secondsToNext: 0,
    }
  }

  let currentIndex = -1
  ordered.forEach((entry, index) => {
    if (entry.minutes * 60 <= nowSeconds) currentIndex = index
  })

  const nextEntry = ordered[(currentIndex + 1) % ordered.length]!
  const secondsToNext = wrapSeconds(nextEntry.minutes * 60 - nowSeconds)
  return {
    current: currentIndex === -1 ? null : ordered[currentIndex]!.prayer,
    next: nextEntry.prayer,
    minutesToNext: Math.floor(secondsToNext / 60),
    secondsToNext,
  }
}

export function isDistrict(value: unknown): value is District {
  return typeof value === 'string' && DISTRICTS.includes(value as District)
}

/** Resolves a persisted selection; unknown or missing values fall back safely. */
export function resolveDistrict(selection: unknown): District {
  if (isDistrict(selection)) return selection
  if (typeof selection === 'string') {
    return LEGACY_DISTRICT_ALIASES[selection] ?? DEFAULT_DISTRICT
  }
  return DEFAULT_DISTRICT
}

/** Fixed per-district minute offset from the default times. */
export function districtOffsetMinutes(district: District): number {
  return OFFSETS[resolveDistrict(district)]
}

export function wrapMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export function wrapSeconds(seconds: number): number {
  return ((seconds % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY
}

/** Applies the district offset to base entries. Idempotent per district input. */
export function adjustForDistrict(
  entries: readonly PrayerEntry[],
  district: District,
): PrayerEntry[] {
  const offset = districtOffsetMinutes(district)
  return entries.map((entry) => ({
    prayer: entry.prayer,
    minutes: wrapMinutes(entry.minutes + offset),
  }))
}

/** Formats an ISO date (YYYY-MM-DD) for an explicit locale (display-ready). */
export function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

/** Formats the weekday of an ISO date for an explicit locale. */
export function formatWeekday(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

/**
 * Returns the source's Hijri date when present, else derives it from the
 * Gregorian date with the Umm al-Qura calendar for the locale.
 */
export function formatHijriDate(
  date: string,
  locale: string,
  hijriDate = '',
): string {
  const source = hijriDate.trim()
  if (source) return source
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export type TimeFormat = '24h' | '12h'

export const DEFAULT_TIME_FORMAT: TimeFormat = '24h'

export function isTimeFormat(value: unknown): value is TimeFormat {
  return value === '24h' || value === '12h'
}

/** Formats minutes since midnight for a locale and clock format. */
export function formatTime(
  minutes: number,
  locale: string,
  format: TimeFormat = DEFAULT_TIME_FORMAT,
): string {
  const date = new Date(Date.UTC(1970, 0, 1, 0, wrapMinutes(minutes)))
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: format === '12h' ? 'h12' : 'h23',
    timeZone: 'UTC',
  }).format(date)
}

export function createPrayerTimes(
  date: string,
  district: District,
  baseEntries: readonly PrayerEntry[],
): PrayerTimes {
  return {
    date,
    district,
    entries: adjustForDistrict(baseEntries, district),
  }
}
