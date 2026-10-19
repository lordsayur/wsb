// specs/extension/spec.md — today's prayer data, offline first.
// Device cache (chrome.storage) always wins; Supabase refreshes it. MORA is
// never contacted at runtime — it is a monthly, manual import.
import { bruneiNow, type PrayerEntry } from '@wsb/core'
import {
  CachedPrayerRepository,
  type PrayerCacheStore,
  type PrayerRepository,
} from '@wsb/data'
import { SupabasePrayerSource } from '@wsb/data/supabase'
import { supabaseConfig } from './config.js'

export interface LoadedDay {
  date: string
  entries: PrayerEntry[]
  hijriDate: string
  stale: boolean
}

/** chrome.storage-backed cache for the data port (async, string values). */
const chromeCache: PrayerCacheStore = {
  async get(key) {
    const values = await chrome.storage.local.get(key)
    const value = values[key]
    return typeof value === 'string' ? value : null
  },
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value })
  },
}

function repository(): PrayerRepository {
  const config = supabaseConfig()
  return new CachedPrayerRepository({
    source: config
      ? new SupabasePrayerSource(config)
      : {
          async fetchPrayerEntries() {
            throw new Error('Supabase is not configured')
          },
        },
    cache: chromeCache,
  })
}

/** Reads today's base entries (Brunei & Muara); never throws. */
export async function loadDay(force = false): Promise<LoadedDay | null> {
  const date = bruneiNow().date
  const repo = repository()
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
