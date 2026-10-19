import { describe, expect, it } from 'vitest'
import { SupabasePrayerSource, timeToMinutes, toEntries } from './supabase.js'

// specs/data/spec.md — Supabase adapter maps rows to port types only.
describe('timeToMinutes', () => {
  it('converts HH:mm:ss to minutes since midnight', () => {
    expect(timeToMinutes('04:51:00')).toBe(291)
    expect(timeToMinutes('19:21:00')).toBe(1161)
  })

  it('rejects malformed times', () => {
    expect(() => timeToMinutes('4.51')).toThrow()
  })
})

describe('toEntries', () => {
  it('returns core prayers in canonical order', () => {
    const entries = toEntries([
      { prayer: 'isyak', time: '19:21:00' },
      { prayer: 'imsak', time: '04:41:00' },
      { prayer: 'subuh', time: '04:51:00' },
      { prayer: 'doha', time: '06:30:00' },
      { prayer: 'syuruk', time: '06:08:00' },
      { prayer: 'zuhur', time: '12:11:00' },
      { prayer: 'asar', time: '15:23:00' },
      { prayer: 'maghrib', time: '18:12:00' },
    ])
    expect(entries.map((entry) => entry.prayer)).toEqual([
      'imsak',
      'subuh',
      'syuruk',
      'doha',
      'zuhur',
      'asar',
      'maghrib',
      'isyak',
    ])
  })

  it('throws when a date has no rows so the repository can degrade', () => {
    expect(() => toEntries([])).toThrow()
  })
})

describe('SupabasePrayerSource', () => {
  it('calls the default fetch without a method receiver', async () => {
    const original = globalThis.fetch
    let receiver: unknown = undefined
    globalThis.fetch = function (this: unknown) {
      receiver = this
      return Promise.resolve(
        new Response(JSON.stringify([{ prayer: 'subuh', time: '04:51:00' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    } as typeof fetch
    try {
      const source = new SupabasePrayerSource({
        url: 'https://example.supabase.co',
        anonKey: 'anon',
      })
      await source.fetchPrayerEntries('2026-10-18', 'bruneiMuara')
    } finally {
      globalThis.fetch = original
    }
    expect(receiver).not.toBeInstanceOf(SupabasePrayerSource)
  })

  it('requests Brunei & Muara base rows for the date', async () => {
    let requested = ''
    const source = new SupabasePrayerSource(
      { url: 'https://example.supabase.co', anonKey: 'anon' },
      (async (input: RequestInfo | URL) => {
        requested = String(input)
        return new Response(
          JSON.stringify([{ prayer: 'subuh', time: '04:51:00' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }) as typeof fetch,
    )

    const day = await source.fetchPrayerEntries('2026-10-18', 'belait')
    expect(day.entries).toEqual([{ prayer: 'subuh', minutes: 291 }])
    expect(day.hijriDate).toBe('')
    expect(requested).toContain('/rest/v1/prayer_times?')
    expect(requested).toContain('prayer_date=eq.2026-10-18')
    expect(requested).toContain('district=eq.bruneiMuara')
  })
})

describe('SupabasePrayerSource hijri date', () => {
  it('returns the hijri_date stored with the rows', async () => {
    const source = new SupabasePrayerSource(
      { url: 'https://example.supabase.co', anonKey: 'anon' },
      (async () =>
        new Response(
          JSON.stringify([
            { prayer: 'subuh', time: '04:51:00', hijri_date: '20 Rabiulakhir 1448 H' },
            { prayer: 'zuhur', time: '12:11:00', hijri_date: '20 Rabiulakhir 1448 H' },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )) as typeof fetch,
    )

    const day = await source.fetchPrayerEntries('2026-10-18', 'bruneiMuara')
    expect(day.hijriDate).toBe('20 Rabiulakhir 1448 H')
  })
})
