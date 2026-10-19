// specs/core/spec.md — Prayer Times core domain.
// Pure TypeScript: no DOM, no network, no vendor types.

export type District = 'bruneiMuara' | 'tutong' | 'belait'

export type PrayerName =
  | 'imsak'
  | 'subuh'
  | 'syuruk'
  | 'doha'
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
  'imsak',
  'subuh',
  'syuruk',
  'doha',
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
 * Imsak, Syuruk and Dhuha are time boundaries, not obligatory prayers, so they
 * are excluded.
 */
export function notificationSchedule(
  entries: readonly PrayerEntry[],
  nowSeconds: number,
): PrayerNotification[] {
  const prayers = PRAYER_ORDER.map((prayer) =>
    entries.find((entry) => entry.prayer === prayer),
  ).filter(
    (entry): entry is PrayerEntry =>
      entry !== undefined &&
      entry.prayer !== 'imsak' &&
      entry.prayer !== 'syuruk' &&
      entry.prayer !== 'doha',
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

// ponytail: CLDR has no Jawi (ms-Arab) data, so Malay names are transliterated
// with a small table. Upgrade path is a Jawi CLDR/ICU locale when one exists.
const ARABIC_SCRIPT_LOCALES = new Set(['ar', 'ms-Arab'])

const JAWI_WORDS: Record<string, string> = {
  // Weekdays: long and short (CLDR abbreviation) forms
  ahad: 'احد',
  isnin: 'اثنين',
  selasa: 'ثلاث',
  rabu: 'رابو',
  khamis: 'خميس',
  jumaat: 'جمعة',
  sabtu: 'سبت',
  ahd: 'احد',
  isn: 'اثنين',
  sel: 'ثلاث',
  rab: 'رابو',
  kha: 'خميس',
  jum: 'جمعة',
  sab: 'سبت',
  // Gregorian months
  januari: 'جنواري',
  februari: 'فيبرواري',
  mac: 'مک',
  april: 'اڤريل',
  mei: 'مي',
  jun: 'جون',
  julai: 'جولاي',
  ogos: 'اوݢوس',
  september: 'سيڤتيمبر',
  oktober: 'اوکتوبر',
  november: 'نوۏيمبر',
  disember: 'ديسيمبر',
  // Hijri months as written by the MORA source
  muharam: 'محرم',
  safar: 'صفر',
  rabiulawal: 'ربيع الأول',
  rabiulakhir: 'ربيع الآخر',
  jamadilawal: 'جمادى الأولى',
  jamadilakhir: 'جمادى الآخرة',
  rejab: 'رجب',
  syaaban: 'شعبان',
  ramadan: 'رمضان',
  syawal: 'شوال',
  zulkaedah: 'ذو القعدة',
  zulhijjah: 'ذو الحجة',
}

/** Transliterates Latin Malay calendar words into Jawi, leaving the rest. */
function toJawi(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => JAWI_WORDS[word.toLowerCase()] ?? word)
}

/** Maps ASCII digits to Arabic-Indic digits (٠١٢…). */
function toArabicIndic(text: string): string {
  return text.replace(/[0-9]/g, (digit) => String.fromCharCode(0x0660 + Number(digit)))
}

/**
 * CLDR defaults `ar` to Latin digits; Arabic-script locales ask for the
 * `arab` numbering system explicitly so times and dates use ٠١٢… digits.
 */
function intlLocale(locale: string): string {
  if (!ARABIC_SCRIPT_LOCALES.has(locale)) return locale
  const base = locale === 'ms-Arab' ? 'ms' : locale
  return `${base}-u-nu-arab`
}

/** Formats an ISO date (YYYY-MM-DD) for an explicit locale (display-ready). */
export function formatDate(date: string, locale: string): string {
  const text = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
  return locale === 'ms-Arab' ? toJawi(text) : text
}

/** Formats the weekday of an ISO date for an explicit locale. */
export function formatWeekday(
  date: string,
  locale: string,
  style: 'long' | 'short' = 'long',
): string {
  const text = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: style,
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
  return locale === 'ms-Arab' ? toJawi(text) : text
}

/** The Brunei month (`YYYY-MM`) an ISO date falls in. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** Moves a `YYYY-MM` month by `delta` months, in either direction. */
export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const shifted = new Date(Date.UTC(year, mon - 1 + delta, 1))
  return shifted.toISOString().slice(0, 7)
}

/** Every ISO date in a `YYYY-MM` month, in calendar order. */
export function monthDates(month: string): string[] {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const days = new Date(Date.UTC(year, mon, 0)).getUTCDate()
  return Array.from(
    { length: days },
    (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`,
  )
}

/** Formats a `YYYY-MM` month name for an explicit locale. */
export function formatMonth(month: string, locale: string): string {
  const text = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`))
  return locale === 'ms-Arab' ? toJawi(text) : text
}

/** Formats the day of the month alone, for compact table rows. */
export function formatDayNumber(date: string, locale: string): string {
  const text = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
  return locale === 'ms-Arab' ? toJawi(text) : text
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
  if (ARABIC_SCRIPT_LOCALES.has(locale)) {
    if (source) return toArabicIndic(toJawi(source)).replace(/\s+H$/i, ' هـ')
    return new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-arab', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
      .format(new Date(`${date}T00:00:00Z`))
      .replace(/\s+هـ$/u, ' هـ')
  }
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
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: format === '12h' ? 'h12' : 'h23',
    timeZone: 'UTC',
  }).format(date)
}

/** Formats a whole number for an explicit locale (Arabic-Indic for ar/Jawi). */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value)
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
