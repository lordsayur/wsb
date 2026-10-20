// specs/vscode/spec.md — today's prayer data, offline first.
// Editor globalState is the device cache; Supabase refreshes it. MORA is
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

/** Memento-backed cache for the data port (async string values). */
export interface MementoLike {
  get<T>(key: string, defaultValue?: T): T | undefined
  update(key: string, value: unknown): Thenable<void>
}

export function mementoCache(memento: MementoLike): PrayerCacheStore {
  return {
    async get(key) {
      const value = memento.get<unknown>(key)
      return typeof value === 'string' ? value : null
    },
    async set(key, value) {
      await memento.update(key, value)
    },
  }
}

export function repository(cache?: PrayerCacheStore): PrayerRepository {
  const config = supabaseConfig()
  return new CachedPrayerRepository({
    source: config
      ? new SupabasePrayerSource(config)
      : {
          async fetchPrayerEntries() {
            throw new Error('Supabase is not configured')
          },
        },
    cache,
  })
}

function today(): string {
  return bruneiNow().date
}

/** Reads today's base entries (Brunei & Muara); never throws. */
export async function loadDay(
  repo: PrayerRepository,
  force = false,
): Promise<LoadedDay | null> {
  const date = today()
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
