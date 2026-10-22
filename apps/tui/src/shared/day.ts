// specs/tui/spec.md — today's prayer data, offline first.
// The state file is the device cache; Supabase refreshes it. MORA is never
// contacted at runtime — it is a monthly, manual import.
import { bruneiNow, type PrayerEntry } from '@wsb/core'
import {
  CachedPrayerRepository,
  type PrayerRepository,
} from '@wsb/data'
import { SupabasePrayerSource } from '@wsb/data/supabase'
import { supabaseConfig } from './config.js'
import type { Stores } from './state.js'

export interface LoadedDay {
  date: string
  entries: PrayerEntry[]
  hijriDate: string
  stale: boolean
}

/** Builds the repository over the device stores; unavailable without config. */
export function repository(stores: Stores = {}): PrayerRepository {
  const config = supabaseConfig()
  return new CachedPrayerRepository({
    source: config
      ? new SupabasePrayerSource(config)
      : {
          async fetchPrayerEntries() {
            throw new Error('Supabase is not configured')
          },
        },
    cache: stores.cache,
    selection: stores.selection,
  })
}

export interface LoadedMonth {
  month: string
  days: { date: string; entries: PrayerEntry[]; hijriDate: string }[]
  stale: boolean
  /** True when at least one day of the month is missing. */
  partial: boolean
}

/** Reads a whole month (Brunei & Muara base times); never throws. */
export async function loadMonth(
  repo: PrayerRepository,
  month: string,
): Promise<LoadedMonth | null> {
  const result = await repo.readMonth(month, 'bruneiMuara')
  if (result.status === 'unavailable') return null
  return {
    month,
    days: result.days,
    stale: result.stale,
    partial: result.days.length < 28,
  }
}

/** Reads one day's base entries (Brunei & Muara); never throws. */
export async function loadDay(
  repo: PrayerRepository,
  date: string = bruneiNow().date,
  force = false,
): Promise<LoadedDay | null> {
  if (force) await repo.refresh(date, 'bruneiMuara')
  const result = await repo.read(date, 'bruneiMuara')
  if (result.status === 'unavailable') return null
  return {
    date,
    entries: result.entries,
    hijriDate: result.hijriDate,
    stale: result.stale,
  }
}
