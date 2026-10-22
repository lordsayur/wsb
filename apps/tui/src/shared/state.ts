// specs/tui/spec.md — durable device storage. A single JSON file under the
// XDG state dir backs both the data port's day cache and the selection, so the
// port stays platform-free and this file stays the only place that knows fs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { LocalPrayerCacheStore, LocalSelectionStore } from '@wsb/data/local'
import type { KeyValueStorage } from '@wsb/data/local'
import type { PrayerCacheStore, SelectionStore } from '@wsb/data'

export function stateDir(): string {
  const base =
    process.env.XDG_STATE_HOME && process.env.XDG_STATE_HOME.length > 0
      ? process.env.XDG_STATE_HOME
      : join(homedir(), '.local', 'state')
  return join(base, 'wsb')
}

export function stateFile(): string {
  return join(stateDir(), 'state.json')
}

/** A flat JSON-file key/value store; a corrupt file reads as empty. */
export function fileStorage(path: string): KeyValueStorage {
  const read = (): Record<string, string> => {
    try {
      const raw = readFileSync(path, 'utf8')
      const parsed = JSON.parse(raw) as unknown
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, string>)
        : {}
    } catch {
      return {}
    }
  }

  return {
    getItem(key) {
      const value = read()[key]
      return typeof value === 'string' ? value : null
    },
    setItem(key, value) {
      const all = read()
      all[key] = value
      try {
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
        writeFileSync(path, JSON.stringify(all), { mode: 0o600 })
      } catch {
        // specs/tui/spec.md — storage is best-effort; memory still works.
      }
    },
  }
}

export interface Stores {
  cache?: PrayerCacheStore
  selection?: SelectionStore
}

/** The device stores, or nothing when the state file cannot be written. */
export function deviceStores(path: string = stateFile()): Stores {
  try {
    const storage = fileStorage(path)
    return {
      cache: new LocalPrayerCacheStore(storage),
      selection: new LocalSelectionStore(storage),
    }
  } catch {
    return {}
  }
}
