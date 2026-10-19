// specs/data/spec.md — backend-agnostic data port. No vendor types may cross it.
import type { District, PrayerEntry } from '@wsb/core'

export interface PrayerDay {
  entries: PrayerEntry[]
  /** The source's Hijri date for the day; empty when unavailable. */
  hijriDate: string
}

export type ReadResult =
  | { status: 'ok'; entries: PrayerEntry[]; hijriDate: string; stale: boolean }
  | { status: 'unavailable' }

export interface PrayerRepository {
  /** Cached data first; falls back to the adapter. Never throws to core. */
  read(date: string, district: District): Promise<ReadResult>
  /** Updates the cache; never blocks rendering; keeps the last good data on failure. */
  refresh(date: string, district: District): Promise<void>
  /** The persisted district selection, or null when missing/corrupt. */
  getSelection(): Promise<District | null>
  setSelection(district: District): Promise<void>
}

/** Key/value storage the adapters use; kept vendor-free. */
export interface SelectionStore {
  get(key: string): string | null
  set(key: string, value: string): void
}

export const SELECTION_KEY = 'wsb.selection'

/** Durable day cache behind the port; shells supply device storage. */
export interface PrayerCacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

export const DAY_CACHE_PREFIX = 'wsb.day.'
export const LAST_DAY_CACHE_PREFIX = 'wsb.day.last.'

export function dayCacheKey(date: string, district: District): string {
  return `${DAY_CACHE_PREFIX}${date}:${district}`
}

export function lastDayCacheKey(district: District): string {
  return `${LAST_DAY_CACHE_PREFIX}${district}`
}

export interface CachedPrayerData {
  date: string
  district: District
  entries: PrayerEntry[]
  hijriDate: string
}

/** Remote source behind the port; adapters translate vendor rows to this. */
export interface RemotePrayerSource {
  fetchPrayerEntries(date: string, district: District): Promise<PrayerDay>
}

export interface PrayerRepositoryDeps {
  source: RemotePrayerSource
  /** Device-backed day cache; without it the repository is memory-only. */
  cache?: PrayerCacheStore
  selection?: SelectionStore
  now?: () => Date
}

/**
 * Offline-first prayer repository: device cache, then the remote source.
 * The remote source is Supabase in every shell; MORA is import-time only.
 */
export class CachedPrayerRepository implements PrayerRepository {
  private readonly memory = new Map<string, CachedPrayerData>()
  private readonly source: RemotePrayerSource
  private readonly cache?: PrayerCacheStore
  private readonly selection?: SelectionStore

  constructor(deps: PrayerRepositoryDeps) {
    this.source = deps.source
    this.cache = deps.cache
    this.selection = deps.selection
  }

  async read(date: string, district: District): Promise<ReadResult> {
    const key = cacheKey(date, district)
    const cached = this.memory.get(key) ?? (await this.readCache(date, district))
    if (cached) {
      return {
        status: 'ok',
        entries: cached.entries,
        hijriDate: cached.hijriDate,
        stale: false,
      }
    }

    try {
      const day = await this.source.fetchPrayerEntries(date, district)
      await this.store({ date, district, ...day })
      return {
        status: 'ok',
        entries: day.entries,
        hijriDate: day.hijriDate,
        stale: false,
      }
    } catch {
      const stale =
        this.lastKnownMemory(district) ?? (await this.lastKnownCache(district))
      return stale
        ? {
            status: 'ok',
            entries: stale.entries,
            hijriDate: stale.hijriDate,
            stale: true,
          }
        : { status: 'unavailable' }
    }
  }

  async refresh(date: string, district: District): Promise<void> {
    try {
      const day = await this.source.fetchPrayerEntries(date, district)
      await this.store({ date, district, ...day })
    } catch {
      // specs/data/spec.md — a failed refresh leaves the previous cache intact.
    }
  }

  async getSelection(): Promise<District | null> {
    const value = this.selection?.get(SELECTION_KEY) ?? null
    return isKnownDistrict(value) ? value : null
  }

  async setSelection(district: District): Promise<void> {
    this.selection?.set(SELECTION_KEY, district)
  }

  private async store(data: CachedPrayerData): Promise<void> {
    this.memory.set(cacheKey(data.date, data.district), data)
    if (!this.cache) return
    try {
      const payload = JSON.stringify(data)
      await this.cache.set(dayCacheKey(data.date, data.district), payload)
      await this.cache.set(lastDayCacheKey(data.district), payload)
    } catch {
      // specs/data/spec.md — cache writes are best-effort; memory still works.
    }
  }

  private async readCache(
    date: string,
    district: District,
  ): Promise<CachedPrayerData | undefined> {
    if (!this.cache) return undefined
    try {
      const raw = await this.cache.get(dayCacheKey(date, district))
      const parsed = raw ? parseCachedDay(raw) : undefined
      if (parsed) this.memory.set(cacheKey(date, district), parsed)
      return parsed
    } catch {
      return undefined
    }
  }

  private async lastKnownCache(
    district: District,
  ): Promise<CachedPrayerData | undefined> {
    for (const entry of this.memory.values()) {
      if (entry.district === district) return entry
    }
    if (!this.cache) return undefined
    try {
      const raw = await this.cache.get(lastDayCacheKey(district))
      return raw ? parseCachedDay(raw) : undefined
    } catch {
      return undefined
    }
  }

  private lastKnownMemory(district: District): CachedPrayerData | undefined {
    return [...this.memory.values()].find((entry) => entry.district === district)
  }
}

function parseCachedDay(raw: string): CachedPrayerData | undefined {
  try {
    const value = JSON.parse(raw) as Partial<CachedPrayerData>
    if (
      typeof value.date !== 'string' ||
      !isKnownDistrict(value.district ?? null) ||
      !Array.isArray(value.entries) ||
      typeof value.hijriDate !== 'string'
    ) {
      return undefined
    }
    return {
      date: value.date,
      district: value.district as District,
      entries: value.entries,
      hijriDate: value.hijriDate,
    }
  } catch {
    return undefined
  }
}

function cacheKey(date: string, district: District): string {
  return `${date}:${district}`
}

const KNOWN: readonly string[] = ['bruneiMuara', 'tutong', 'belait']

function isKnownDistrict(value: string | null): value is District {
  return value !== null && KNOWN.includes(value)
}
