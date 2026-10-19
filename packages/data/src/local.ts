// specs/data/spec.md — durable device storage, no vendor types.
import type { PrayerCacheStore, SelectionStore } from './index.js'

/** The slice of the Web Storage API the store needs. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Device-backed day cache. The shell supplies `localStorage` (or any storage);
 * the port stays platform-free. Offline-first: cached days always win.
 */
export class LocalPrayerCacheStore implements PrayerCacheStore {
  constructor(private readonly storage: KeyValueStorage) {}

  async get(key: string): Promise<string | null> {
    try {
      return this.storage.getItem(key)
    } catch {
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.storage.setItem(key, value)
    } catch {
      // specs/data/spec.md — storage can be full or blocked; keep running.
    }
  }
}

/**
 * Device-backed selection store. The shell supplies `localStorage` (or any
 * storage); the port stays platform-free.
 */
export class LocalSelectionStore implements SelectionStore {
  constructor(private readonly storage: KeyValueStorage) {}

  get(key: string): string | null {
    try {
      return this.storage.getItem(key)
    } catch {
      return null
    }
  }

  set(key: string, value: string): void {
    try {
      this.storage.setItem(key, value)
    } catch {
      // specs/data/spec.md — storage can be full or blocked; keep running.
    }
  }
}
