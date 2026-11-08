import { describe, expect, it } from 'vitest'
import type { District, PrayerEntry } from '@wsb/core'
import {
  CachedPrayerRepository,
  MONTH_CACHE_TTL_MS,
  SELECTION_KEY,
  dayCacheKey,
  type PrayerCacheStore,
  type RemotePrayerSource,
  type SelectionStore,
} from './index.js'
import { LocalSelectionStore, type KeyValueStorage } from './local.js'

// specs/data/spec.md — acceptance criteria
const entries: PrayerEntry[] = [
  { prayer: 'subuh', minutes: 300 },
  { prayer: 'syuruk', minutes: 360 },
]

function source(
  impl: RemotePrayerSource['fetchPrayerEntries'],
): RemotePrayerSource {
  return { fetchPrayerEntries: impl }
}

/** Wraps entries in a day with no Hijri date unless the test supplies one. */
function day(entriesInput: PrayerEntry[], hijriDate = '') {
  return { entries: entriesInput, hijriDate }
}

function selectionStore(initial: Record<string, string> = {}): SelectionStore {
  const values = new Map(Object.entries(initial))
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('read', () => {
  it('returns unavailable with empty cache and no network', async () => {
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
    })
    await expect(repo.read('2026-10-18', 'bruneiMuara')).resolves.toEqual({
      status: 'unavailable',
    })
  })

  it('returns populated cache even when offline', async () => {
    let online = true
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        if (!online) throw new Error('offline')
        return day(entries)
      }),
    })

    const first = await repo.read('2026-10-18', 'bruneiMuara')
    online = false
    const second = await repo.read('2026-10-18', 'bruneiMuara')

    expect(first).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '',
      stale: false,
    })
    expect(second).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '',
      stale: false,
    })
  })

  it('falls back to last known data for another date when offline', async () => {
    let online = true
    const repo = new CachedPrayerRepository({
      source: source(async (date: string) => {
        if (!online) throw new Error('offline')
        return date === '2026-10-18' ? day(entries) : day([])
      }),
    })

    await repo.read('2026-10-18', 'bruneiMuara')
    online = false
    const result = await repo.read('2026-10-19', 'bruneiMuara')

    // The stale day keeps the date it was fetched for, not the requested one.
    expect(result).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '',
      stale: true,
    })
  })
})

describe('refresh', () => {
  it('a failed refresh leaves the previous cached data readable', async () => {
    let fail = false
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        if (fail) throw new Error('offline')
        return day(entries)
      }),
    })

    await repo.read('2026-10-18', 'bruneiMuara')
    fail = true
    await repo.refresh('2026-10-18', 'bruneiMuara')

    await expect(repo.read('2026-10-18', 'bruneiMuara')).resolves.toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '',
      stale: false,
    })
  })
})

/** In-memory cache seeded with explicit payloads, for aging tests. */
function memoryCache(seed: Record<string, string> = {}): PrayerCacheStore {
  const values = new Map<string, string>(Object.entries(seed))
  return {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, value)
    },
    getSync: (key) => values.get(key) ?? null,
  }
}

describe('durable cache', () => {
  function cacheStore(): PrayerCacheStore {
    const values = new Map<string, string>()
    return {
      get: async (key) => values.get(key) ?? null,
      set: async (key, value) => {
        values.set(key, value)
      },
    }
  }

  it('serves a cached day without touching the network', async () => {
    const cache = cacheStore()
    let calls = 0
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        calls += 1
        return day(entries, 'date')
      }),
      cache,
    })
    await repo.read('2026-10-18', 'bruneiMuara')

    const fresh = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
      cache,
    })
    await expect(fresh.read('2026-10-18', 'bruneiMuara')).resolves.toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: 'date',
      stale: false,
    })
    expect(calls).toBe(1)
  })

  it('falls back to the last cached day on a new day when offline', async () => {
    const cache = cacheStore()
    const online = new CachedPrayerRepository({
      source: source(async () => day(entries, 'date')),
      cache,
    })
    await online.read('2026-10-18', 'bruneiMuara')

    const offline = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
      cache,
    })
    await expect(offline.read('2026-10-19', 'bruneiMuara')).resolves.toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: 'date',
      stale: true,
    })
  })

  it('ignores a corrupted cache entry', async () => {
    const cache = cacheStore()
    await cache.set(dayCacheKey('2026-10-18', 'bruneiMuara'), 'not json')
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      cache,
    })
    await expect(repo.read('2026-10-18', 'bruneiMuara')).resolves.toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '',
      stale: false,
    })
  })

  it('peeks a cached day synchronously for the first paint', async () => {
    const values = new Map<string, string>()
    const cache: PrayerCacheStore = {
      get: async (key) => values.get(key) ?? null,
      set: async (key, value) => {
        values.set(key, value)
      },
      getSync: (key) => values.get(key) ?? null,
    }
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries, 'date')),
      cache,
    })
    await repo.read('2026-10-18', 'bruneiMuara')

    const fresh = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
      cache,
    })
    expect(fresh.peek('2026-10-18', 'bruneiMuara')).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: 'date',
      stale: false,
    })
  })

  it('peeks the last known day synchronously, marked stale', async () => {
    const values = new Map<string, string>()
    const cache: PrayerCacheStore = {
      get: async (key) => values.get(key) ?? null,
      set: async (key, value) => {
        values.set(key, value)
      },
      getSync: (key) => values.get(key) ?? null,
    }
    const online = new CachedPrayerRepository({
      source: source(async () => day(entries, 'date')),
      cache,
    })
    await online.read('2026-10-18', 'bruneiMuara')

    const fresh = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
      cache,
    })
    expect(fresh.peek('2026-10-19', 'bruneiMuara')).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: 'date',
      stale: true,
    })
  })

  it('peeks nothing when the store cannot read synchronously', () => {
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries)),
    })
    expect(repo.peek('2026-10-18', 'bruneiMuara')).toBeNull()
  })
})

describe('selection', () => {
  it('round-trips a known district', async () => {
    const store = selectionStore()
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      selection: store,
    })

    await repo.setSelection('tutong')
    await expect(repo.getSelection()).resolves.toBe('tutong')
    expect(store.get(SELECTION_KEY)).toBe('tutong')
  })

  it('reads a corrupt value back as no selection', async () => {
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      selection: selectionStore({ [SELECTION_KEY]: 'mars' }),
    })
    await expect(repo.getSelection()).resolves.toBeNull()
  })
})

describe('hijri date', () => {
  it('returns the source hijri date stored with the day', async () => {
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries, '20 Rabiulakhir 1448 H')),
    })
    const result = await repo.read('2026-10-18', 'bruneiMuara')
    expect(result).toEqual({
      status: 'ok',
      date: '2026-10-18',
      entries,
      hijriDate: '20 Rabiulakhir 1448 H',
      stale: false,
    })
  })
})

describe('port boundary', () => {
  it('never exposes vendor types', async () => {
    const repo = new CachedPrayerRepository({
      source: source(async (_date: string, district: District) => {
        expect(typeof district).toBe('string')
        return day(entries)
      }),
    })
    const result = await repo.read('2026-10-18', 'belait')
    expect(result.status).toBe('ok')
  })
})

describe('LocalSelectionStore', () => {
  function fakeStorage(): KeyValueStorage {
    const values = new Map<string, string>()
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    }
  }

  it('persists a selection across repository instances', async () => {
    const storage = fakeStorage()
    const first = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      selection: new LocalSelectionStore(storage),
    })
    await first.setSelection('belait')

    const second = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      selection: new LocalSelectionStore(storage),
    })
    await expect(second.getSelection()).resolves.toBe('belait')
  })

  it('reads back no selection when storage throws', async () => {
    const store = new LocalSelectionStore({
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {},
    })
    expect(store.get('wsb.selection')).toBeNull()
  })
})


// specs/data/spec.md — monthly read: cached days first, missing days fetched.
describe('readMonth', () => {
  const monthEntries: PrayerEntry[] = [
    { prayer: 'subuh', minutes: 300 },
    { prayer: 'isyak', minutes: 1_160 },
  ]

  it('returns a full month when the source can serve it in bulk', async () => {
    let bulkMonth = ''
    const repo = new CachedPrayerRepository({
      source: {
        async fetchPrayerEntries() {
          throw new Error('should not be used')
        },
        async fetchPrayerMonth(month: string) {
          bulkMonth = month
          return ['2026-10-01', '2026-10-02'].map((date) => ({
            date,
            entries: monthEntries,
            hijriDate: '7 Jamadilawal 1448 H',
          }))
        },
      },
    })
    const result = await repo.readMonth('2026-10', 'bruneiMuara')
    expect(bulkMonth).toBe('2026-10')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.days).toHaveLength(2)
    expect(result.days[0]!.entries).toEqual(monthEntries)
    expect(result.stale).toBe(true)
  })

  it('never throws to core when the source fails and nothing is cached', async () => {
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        throw new Error('offline')
      }),
    })
    await expect(repo.readMonth('2026-10', 'bruneiMuara')).resolves.toEqual({
      status: 'unavailable',
    })
  })

  it('serves cached days offline', async () => {
    let online = true
    const repo = new CachedPrayerRepository({
      source: source(async () => {
        if (!online) throw new Error('offline')
        return day(monthEntries, 'hijri')
      }),
    })
    await repo.read('2026-10-01', 'bruneiMuara')
    online = false
    const result = await repo.readMonth('2026-10', 'bruneiMuara')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    const [first] = result.days
    expect(first).toEqual({
      date: '2026-10-01',
      entries: monthEntries,
      hijriDate: 'hijri',
    })
    // One cached day of a 31-day month means the month is incomplete.
    expect(result.stale).toBe(true)
  })

  it('re-fetches an expired month instead of trusting the cache', async () => {
    const all = Array.from(
      { length: 28 },
      (_, index) => `2026-02-${String(index + 1).padStart(2, '0')}`,
    )
    let fetchCount = 0
    const repo = new CachedPrayerRepository({
      source: {
        async fetchPrayerEntries() {
          throw new Error('should not be used')
        },
        async fetchPrayerMonth() {
          fetchCount++
          return all.map((date) => ({ date, entries: monthEntries, hijriDate: '' }))
        },
      },
    })
    await repo.readMonth('2026-02', 'bruneiMuara')
    expect(fetchCount).toBe(1)

    // A second read of a fresh month stays on the cache.
    await repo.readMonth('2026-02', 'bruneiMuara')
    expect(fetchCount).toBe(1)

    // The same month with expired stamps is re-fetched, not trusted.
    const aged = new CachedPrayerRepository({
      source: {
        async fetchPrayerEntries() {
          throw new Error('should not be used')
        },
        async fetchPrayerMonth() {
          fetchCount++
          return all.map((date) => ({ date, entries: monthEntries, hijriDate: '' }))
        },
      },
      cache: memoryCache(
        Object.fromEntries(
          all.map((date) => [
            dayCacheKey(date, 'bruneiMuara'),
            JSON.stringify({
              date,
              district: 'bruneiMuara',
              entries: monthEntries,
              hijriDate: '',
              fetchedAt: Date.now() - MONTH_CACHE_TTL_MS - 1,
            }),
          ]),
        ),
      ),
    })
    const refreshed = await aged.readMonth('2026-02', 'bruneiMuara')
    expect(fetchCount).toBe(2)
    expect(refreshed.status).toBe('ok')
    if (refreshed.status !== 'ok') return
    expect(refreshed.stale).toBe(false)
  })

  it('marks the month stale when expired days cannot be refreshed', async () => {
    const all = Array.from(
      { length: 28 },
      (_, index) => `2026-03-${String(index + 1).padStart(2, '0')}`,
    )
    const aged = new CachedPrayerRepository({
      source: {
        async fetchPrayerEntries() {
          throw new Error('should not be used')
        },
        async fetchPrayerMonth() {
          throw new Error('offline')
        },
      },
      cache: memoryCache(
        Object.fromEntries(
          all.map((date) => [
            dayCacheKey(date, 'bruneiMuara'),
            JSON.stringify({
              date,
              district: 'bruneiMuara',
              entries: monthEntries,
              hijriDate: '',
              fetchedAt: Date.now() - MONTH_CACHE_TTL_MS - 1,
            }),
          ]),
        ),
      ),
    })
    const result = await aged.readMonth('2026-03', 'bruneiMuara')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.days).toHaveLength(all.length)
    expect(result.stale).toBe(true)
  })

  it('treats a complete freshly cached month as current, not stale', async () => {
    // February 2026 has 28 days; the fixture supplies every one.
    const all = Array.from(
      { length: 28 },
      (_, index) => `2026-02-${String(index + 1).padStart(2, '0')}`,
    )
    const repo = new CachedPrayerRepository({
      source: {
        async fetchPrayerEntries() {
          throw new Error('should not be used')
        },
        async fetchPrayerMonth() {
          return all.map((date) => ({ date, entries: monthEntries, hijriDate: '' }))
        },
      },
    })
    await repo.readMonth('2026-02', 'bruneiMuara')
    // A second read comes entirely from the cache, but the month is whole.
    const result = await repo.readMonth('2026-02', 'bruneiMuara')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.days.map((day) => day.date)).toEqual(all)
    expect(result.stale).toBe(false)
  })
})
