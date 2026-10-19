import { describe, expect, it } from 'vitest'
import type { District, PrayerEntry } from '@wsb/core'
import {
  CachedPrayerRepository,
  SELECTION_KEY,
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

    expect(first).toEqual({ status: 'ok', entries, hijriDate: '', stale: false })
    expect(second).toEqual({ status: 'ok', entries, hijriDate: '', stale: false })
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

    expect(result).toEqual({ status: 'ok', entries, hijriDate: '', stale: true })
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
      entries,
      hijriDate: '',
      stale: false,
    })
  })
})

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
      entries,
      hijriDate: 'date',
      stale: true,
    })
  })

  it('ignores a corrupted cache entry', async () => {
    const cache = cacheStore()
    await cache.set('wsb.day.2026-10-18:bruneiMuara', 'not json')
    const repo = new CachedPrayerRepository({
      source: source(async () => day(entries)),
      cache,
    })
    await expect(repo.read('2026-10-18', 'bruneiMuara')).resolves.toEqual({
      status: 'ok',
      entries,
      hijriDate: '',
      stale: false,
    })
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
