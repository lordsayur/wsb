import { describe, expect, it } from 'vitest'
import {
  MORA_PAGE_URL,
  bruneiYearMonth,
  moraDateToLocalDate,
  moraMonthRange,
  moraTimeTo24Hour,
  normalizeMoraItems,
  toSql,
  type MoraItem,
} from './mora.js'

// specs/data/spec.md — MORA source adapter acceptance criteria.
describe('moraMonthRange', () => {
  it('covers exactly one Brunei calendar month', () => {
    expect(moraMonthRange(2026, 10)).toEqual({
      fromIso: '2026-09-30T16:00:00.000Z',
      toIso: '2026-10-31T16:00:00.000Z',
    })
  })

  it('rolls over December to the next January', () => {
    expect(moraMonthRange(2026, 12)).toEqual({
      fromIso: '2026-11-30T16:00:00.000Z',
      toIso: '2026-12-31T16:00:00.000Z',
    })
  })
})

describe('bruneiYearMonth', () => {
  it('uses Brunei time, not UTC', () => {
    expect(bruneiYearMonth(new Date('2026-12-31T16:30:00Z'))).toEqual({
      year: 2027,
      month: 1,
    })
  })
})

describe('moraDateToLocalDate', () => {
  it('converts the stored UTC midnight to the Brunei calendar date', () => {
    expect(moraDateToLocalDate('2026-10-01T16:00:00Z')).toBe('2026-10-02')
  })
})

describe('moraTimeTo24Hour', () => {
  it('keeps morning times as-is', () => {
    expect(moraTimeTo24Hour('subuh', '4.51')).toBe('04:51:00')
  })

  it('keeps noon as 12', () => {
    expect(moraTimeTo24Hour('zuhur', '12.11')).toBe('12:11:00')
  })

  it('adds 12 hours to afternoon times', () => {
    expect(moraTimeTo24Hour('asar', '3.23')).toBe('15:23:00')
    expect(moraTimeTo24Hour('maghrib', '6.12')).toBe('18:12:00')
    expect(moraTimeTo24Hour('isyak', '7.21')).toBe('19:21:00')
  })

  it('returns null for empty cells', () => {
    expect(moraTimeTo24Hour('imsak', '-')).toBeNull()
    expect(moraTimeTo24Hour('imsak', '  ')).toBeNull()
  })
})

describe('normalizeMoraItems', () => {
  const item: MoraItem = {
    Title: 'Waktu Solat',
    Date: '2026-10-01T16:00:00Z',
    Tarikh: '20 Rabiulakhir 1448 H',
    Imsak: '4.41',
    Suboh: '4.51',
    Syuruk: '6.08',
    Doha: '6.30',
    Zohor: '12.11',
    Asar: '3.23',
    Maghrib: '6.12',
    Isyak: '7.21',
  }

  it('produces one record per prayer time', () => {
    const records = normalizeMoraItems([item])
    expect(records).toHaveLength(8)
    expect(records[0]).toEqual({
      prayerDate: '2026-10-02',
      district: 'bruneiMuara',
      prayer: 'imsak',
      time: '04:41:00',
      hijriDate: '20 Rabiulakhir 1448 H',
      sourceUrl: MORA_PAGE_URL,
    })
    expect(records.map((record) => record.prayer)).toEqual([
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
})

describe('toSql', () => {
  it('emits one upsert value per record', () => {
    const sql = toSql(
      normalizeMoraItems([
        {
          Date: '2026-10-01T16:00:00Z',
          Tarikh: '20 Rabiulakhir 1448 H',
          Imsak: '4.41',
          Suboh: '4.51',
        },
      ]),
    )
    expect(sql).toContain(
      "('2026-10-02', 'bruneiMuara', 'imsak', '04:41:00', '20 Rabiulakhir 1448 H'",
    )
    expect(sql).toContain('on conflict (prayer_date, district, prayer)')
  })
})
