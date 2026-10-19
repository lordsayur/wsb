// specs/data/spec.md — Supabase adapter for the prayer_times table.
// Rows hold Brunei & Muara base times; core applies district offsets.
import { PRAYER_ORDER, type District, type PrayerEntry } from '@wsb/core'
import type { PrayerDay, RemotePrayerSource } from './index.js'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

interface PrayerTimeRow {
  prayer: string
  time: string
  hijri_date?: string
}

/** "04:51:00" -> 291. Throws on malformed rows so the port can fall back. */
export function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) throw new Error(`Invalid prayer time: ${value}`)
  return Number(match[1]) * 60 + Number(match[2])
}

export class SupabasePrayerSource implements RemotePrayerSource {
  constructor(
    private readonly config: SupabaseConfig,
    // Wrap, don't reference: window.fetch throws "Illegal invocation" when
    // called as a method (Node tolerates it, which is why tests passed).
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async fetchPrayerEntries(
    date: string,
    _district: District,
  ): Promise<PrayerDay> {
    const query = new URLSearchParams({
      prayer_date: `eq.${date}`,
      district: 'eq.bruneiMuara',
      select: 'prayer,time,hijri_date',
    })
    const response = await this.fetchImpl(
      `${this.config.url}/rest/v1/prayer_times?${query}`,
      {
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
          Accept: 'application/json',
        },
      },
    )
    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.status}`)
    }
    const rows = (await response.json()) as PrayerTimeRow[]
    return {
      entries: toEntries(rows),
      hijriDate: rows.find((row) => row.hijri_date)?.hijri_date ?? '',
    }
  }
}

export function toEntries(rows: readonly PrayerTimeRow[]): PrayerEntry[] {
  const byPrayer = new Map(rows.map((row) => [row.prayer, row.time]))
  const entries: PrayerEntry[] = []
  for (const prayer of PRAYER_ORDER) {
    const time = byPrayer.get(prayer)
    if (!time) continue
    entries.push({ prayer, minutes: timeToMinutes(time) })
  }
  if (entries.length === 0) throw new Error('No prayer times for this date')
  return entries
}
