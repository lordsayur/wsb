// specs/data/spec.md — admin import/edit payload validation.
// Pure functions shared by the admin Edge Function and its tests; no vendor
// types and no I/O.
export const STORED_PRAYERS = [
  'imsak',
  'subuh',
  'syuruk',
  'doha',
  'zuhur',
  'asar',
  'maghrib',
  'isyak',
] as const

export type StoredPrayer = (typeof STORED_PRAYERS)[number]

/** One row of `prayer_times`, as the admin surface sees it. */
export interface AdminRecord {
  prayerDate: string
  prayer: StoredPrayer
  time: string
  hijriDate: string
}

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH.test(value)
}

export function isStoredPrayer(value: unknown): value is StoredPrayer {
  return (
    typeof value === 'string' &&
    (STORED_PRAYERS as readonly string[]).includes(value)
  )
}

/** True only for real calendar dates in `YYYY-MM-DD` form. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE.exec(value)
  if (!match) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

/** "4:07" or "04:07:30" -> "04:07:30"; null when not a valid clock time. */
export function normalizeTimeInput(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = TIME.exec(value.trim())
  if (!match) return null
  return `${match[1]}:${match[2]}:${match[3] ?? '00'}`
}

/** One admin table row: a date, its Hijri date, and its eight stored times. */
export interface AdminDay {
  prayerDate: string
  hijriDate: string
  times: Record<StoredPrayer, string | null>
}

/** Groups flat records into one row per day in date order. */
export function adminMonthDays(
  records: readonly AdminRecord[],
): AdminDay[] {
  const byDate = new Map<string, AdminDay>()
  for (const record of records) {
    let day = byDate.get(record.prayerDate)
    if (!day) {
      day = {
        prayerDate: record.prayerDate,
        hijriDate: '',
        times: Object.fromEntries(
          STORED_PRAYERS.map((prayer) => [prayer, null]),
        ) as Record<StoredPrayer, string | null>,
      }
      byDate.set(record.prayerDate, day)
    }
    day.times[record.prayer] = record.time
    if (record.hijriDate) day.hijriDate = record.hijriDate
  }
  return [...byDate.values()].sort((a, b) =>
    a.prayerDate.localeCompare(b.prayerDate),
  )
}

/** Stable key for one staged cell: a date and a prayer. */
export function adminEditKey(
  prayerDate: string,
  prayer: StoredPrayer,
): string {
  return `${prayerDate}:${prayer}`
}

/** Overlays staged cell edits onto the month rows for display. */
export function applyAdminEdits(
  days: readonly AdminDay[],
  edits: Readonly<Record<string, string>>,
): AdminDay[] {
  return days.map((day) => {
    const times = { ...day.times }
    for (const prayer of STORED_PRAYERS) {
      const time = edits[adminEditKey(day.prayerDate, prayer)]
      if (time) times[prayer] = time
    }
    return { ...day, times }
  })
}

/** One upsert payload per staged cell, carrying that day's Hijri date. */
export function adminPendingRecords(
  days: readonly AdminDay[],
  edits: Readonly<Record<string, string>>,
): AdminRecord[] {
  const byDate = new Map(days.map((day) => [day.prayerDate, day]))
  const records: AdminRecord[] = []
  for (const [key, time] of Object.entries(edits)) {
    const [prayerDate, prayer] = key.split(':') as [string, StoredPrayer]
    records.push({
      prayerDate,
      prayer,
      time,
      hijriDate: byDate.get(prayerDate)?.hijriDate ?? '',
    })
  }
  return records
}

/** Validates one edit; unknown fields are ignored, bad values are rejected. */
export function validateRecordEdit(value: unknown): Validation<AdminRecord> {
  const input = (value ?? {}) as Partial<Record<keyof AdminRecord, unknown>>
  if (!isIsoDate(input.prayerDate)) {
    return { ok: false, error: 'Invalid prayer date' }
  }
  if (!isStoredPrayer(input.prayer)) {
    return { ok: false, error: 'Invalid prayer' }
  }
  const time = normalizeTimeInput(input.time)
  if (!time) return { ok: false, error: 'Invalid time' }
  return {
    ok: true,
    value: {
      prayerDate: input.prayerDate,
      prayer: input.prayer,
      time,
      hijriDate: typeof input.hijriDate === 'string' ? input.hijriDate : '',
    },
  }
}
