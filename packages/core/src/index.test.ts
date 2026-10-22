import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DISTRICT,
  PRAYER_ORDER,
  adjustForDistrict,
  bruneiNow,
  districtOffsetMinutes,
  durationParts,
  formatDate,
  formatHijriDate,
  formatNumber,
  formatTime,
  formatMonth,
  formatDayNumber,
  formatWeekday,
  isTimeFormat,
  chartBounds,
  chartIsCurrent,
  chartMedian,
  isChartOutlier,
  formatShortDate,
  formatChartPeriod,
  rangeDates,
  shiftChartDate,
  shiftDate,
  monthDates,
  monthOf,
  shiftMonth,
  notificationSchedule,
  prayerProgress,
  resolveDistrict,
  type PrayerEntry,
} from './index.js'

// specs/core/spec.md — acceptance criteria
describe('district offsets', () => {
  it('uses Brunei & Muara as the default district', () => {
    expect(DEFAULT_DISTRICT).toBe('bruneiMuara')
  })

  it('applies 0 minutes to Brunei & Muara', () => {
    expect(districtOffsetMinutes('bruneiMuara')).toBe(0)
  })

  it('applies +1 minute to Tutong', () => {
    expect(districtOffsetMinutes('tutong')).toBe(1)
  })

  it('applies +3 minutes to Belait', () => {
    expect(districtOffsetMinutes('belait')).toBe(3)
  })
})

describe('selection', () => {
  it('resolves a known district', () => {
    expect(resolveDistrict('belait')).toBe('belait')
  })

  it('maps the legacy Temburong value to Brunei & Muara', () => {
    expect(resolveDistrict('temburong')).toBe('bruneiMuara')
  })

  it('falls back to the default when no selection exists', () => {
    expect(resolveDistrict(null)).toBe(DEFAULT_DISTRICT)
    expect(resolveDistrict(undefined)).toBe(DEFAULT_DISTRICT)
  })

  it('falls back to the default for an unknown district without throwing', () => {
    expect(resolveDistrict('mars')).toBe(DEFAULT_DISTRICT)
  })
})

describe('prayer order', () => {
  it('returns the eight entries in the documented order', () => {
    expect(PRAYER_ORDER).toEqual([
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

  it('puts imsak first', () => {
    expect(PRAYER_ORDER[0]).toBe('imsak')
  })

  it('keeps syuruk between subuh and zuhur', () => {
    expect(PRAYER_ORDER.indexOf('syuruk')).toBe(
      PRAYER_ORDER.indexOf('subuh') + 1,
    )
    expect(PRAYER_ORDER.indexOf('syuruk')).toBeLessThan(
      PRAYER_ORDER.indexOf('zuhur'),
    )
    expect(PRAYER_ORDER.indexOf('doha')).toBe(
      PRAYER_ORDER.indexOf('syuruk') + 1,
    )
  })
})

describe('adjustForDistrict', () => {
  const base = PRAYER_ORDER.map((prayer, index) => ({
    prayer,
    minutes: 5 * 60 + index,
  }))

  it('is idempotent for the same district', () => {
    expect(adjustForDistrict(base, 'tutong')).toEqual(
      adjustForDistrict(base, 'tutong'),
    )
  })

  it('shifts every entry by the district offset', () => {
    const tutong = adjustForDistrict(base, 'tutong')
    expect(tutong.map((entry) => entry.minutes)).toEqual(
      base.map((entry) => entry.minutes + 1),
    )

    const belait = adjustForDistrict(base, 'belait')
    expect(belait.map((entry) => entry.minutes)).toEqual(
      base.map((entry) => entry.minutes + 3),
    )
  })

  it('wraps past midnight', () => {
    const late = [{ prayer: 'isyak' as const, minutes: 23 * 60 + 59 }]
    expect(adjustForDistrict(late, 'belait')[0]!.minutes).toBe(2)
  })
})

describe('formatTime', () => {
  it('formats minutes since midnight for a locale', () => {
    expect(formatTime(5 * 60 + 7, 'en-GB')).toContain('05:07')
  })

  it('defaults to 24-hour time', () => {
    expect(formatTime(15 * 60 + 20, 'en-GB')).toBe('15:20')
  })

  it('renders 12-hour time when asked', () => {
    const morning = formatTime(5 * 60 + 7, 'en-US', '12h')
    const afternoon = formatTime(15 * 60 + 20, 'en-US', '12h')
    expect(morning).toMatch(/^05:07\s?AM$/i)
    expect(afternoon).toMatch(/^03:20\s?PM$/i)
  })

  it('validates time formats', () => {
    expect(isTimeFormat('12h')).toBe(true)
    expect(isTimeFormat('24h')).toBe(true)
    expect(isTimeFormat('13h')).toBe(false)
  })
})

// specs/core/spec.md — current/next entry and duration to next.
describe('prayerProgress', () => {
  const entries: PrayerEntry[] = [
    { prayer: 'imsak', minutes: 4 * 60 + 41 },
    { prayer: 'subuh', minutes: 4 * 60 + 50 },
    { prayer: 'syuruk', minutes: 6 * 60 + 5 },
    { prayer: 'doha', minutes: 6 * 60 + 40 },
    { prayer: 'zuhur', minutes: 12 * 60 + 5 },
    { prayer: 'asar', minutes: 15 * 60 + 20 },
    { prayer: 'maghrib', minutes: 18 * 60 + 10 },
    { prayer: 'isyak', minutes: 19 * 60 + 20 },
  ]

  it('has no current entry before imsak and points to imsak next', () => {
    expect(prayerProgress(entries, 4 * 60 * 60)).toEqual({
      current: null,
      next: 'imsak',
      minutesToNext: 41,
      secondsToNext: 41 * 60,
    })
  })

  it('treats imsak as the first boundary of the day', () => {
    expect(prayerProgress(entries, (4 * 60 + 45) * 60).current).toBe('imsak')
    expect(prayerProgress(entries, (4 * 60 + 45) * 60).next).toBe('subuh')
  })

  it('selects the last entry whose time has passed', () => {
    expect(prayerProgress(entries, 13 * 60 * 60).current).toBe('zuhur')
    expect(prayerProgress(entries, 13 * 60 * 60).next).toBe('asar')
  })

  it('treats syuruk as a boundary though it is not a prayer', () => {
    expect(prayerProgress(entries, (6 * 60 + 30) * 60).current).toBe('syuruk')
  })

  it('wraps from isyak to the next day imsak', () => {
    const progress = prayerProgress(entries, 23 * 60 * 60)
    expect(progress.current).toBe('isyak')
    expect(progress.next).toBe('imsak')
    expect(progress.minutesToNext).toBe(5 * 60 + 41)
    expect(progress.secondsToNext).toBe((5 * 60 + 41) * 60)
  })

  it('measures duration from the entry itself at the boundary', () => {
    expect(prayerProgress(entries, (12 * 60 + 5) * 60)).toEqual({
      current: 'zuhur',
      next: 'asar',
      minutesToNext: 3 * 60 + 15,
      secondsToNext: (3 * 60 + 15) * 60,
    })
  })

  it('reports seconds remaining under a minute', () => {
    const progress = prayerProgress(entries, (4 * 60 + 40) * 60 + 18)
    expect(progress.next).toBe('imsak')
    expect(progress.minutesToNext).toBe(0)
    expect(progress.secondsToNext).toBe(42)
  })
})

// specs/core/spec.md — reminders 15 minutes before and at each prayer.
describe('notificationSchedule', () => {
  const entries: PrayerEntry[] = [
    { prayer: 'imsak', minutes: 4 * 60 + 41 },
    { prayer: 'subuh', minutes: 4 * 60 + 50 },
    { prayer: 'syuruk', minutes: 6 * 60 + 5 },
    { prayer: 'doha', minutes: 6 * 60 + 40 },
    { prayer: 'zuhur', minutes: 12 * 60 + 5 },
    { prayer: 'asar', minutes: 15 * 60 + 20 },
    { prayer: 'maghrib', minutes: 18 * 60 + 10 },
    { prayer: 'isyak', minutes: 19 * 60 + 20 },
  ]

  it('returns lead and due reminders nearest first', () => {
    const events = notificationSchedule(entries, 4 * 60 * 60)
    expect(events[0]).toMatchObject({
      prayer: 'subuh',
      kind: 'lead',
      secondsUntil: (50 - 15) * 60,
    })
    expect(events[1]).toMatchObject({
      prayer: 'subuh',
      kind: 'due',
      secondsUntil: 50 * 60,
    })
    const times = events.map((event) => event.secondsUntil)
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('excludes imsak, syuruk and doha, which are not prayers', () => {
    const events = notificationSchedule(entries, 0)
    expect(events.some((event) => event.prayer === 'imsak')).toBe(false)
    expect(events.some((event) => event.prayer === 'syuruk')).toBe(false)
    expect(events.some((event) => event.prayer === 'doha')).toBe(false)
  })

  it('rolls upcoming reminders into the next day', () => {
    const events = notificationSchedule(entries, 20 * 60 * 60)
    expect(events[0]).toMatchObject({ prayer: 'subuh', kind: 'lead' })
    expect(events[0]!.secondsUntil).toBe(
      (24 * 60 + 4 * 60 + 50 - 15 - 20 * 60) * 60,
    )
  })

  it('rolls a lead reminder whose time has passed into the next day', () => {
    const now = (4 * 60 + 49) * 60
    const events = notificationSchedule(entries, now)
    expect(events[0]).toMatchObject({ prayer: 'subuh', kind: 'due' })
    expect(events[0]!.secondsUntil).toBe(60)
    const lead = events.find(
      (event) => event.kind === 'lead' && event.prayer === 'subuh',
    )!
    expect(lead.prayer).toBe('subuh')
    expect(lead.secondsUntil).toBe(102_900 - 17_340)
  })
})

describe('bruneiNow', () => {  it('uses Brunei wall-clock time regardless of the input timezone', () => {
    expect(bruneiNow(new Date('2026-10-18T00:30:00Z'))).toEqual({
      date: '2026-10-18',
      minutes: 8 * 60 + 30,
      seconds: (8 * 60 + 30) * 60,
    })
    expect(bruneiNow(new Date('2026-10-18T16:30:45Z'))).toEqual({
      date: '2026-10-19',
      minutes: 30,
      seconds: 30 * 60 + 45,
    })
  })
})

describe('durationParts', () => {
  it('splits seconds into whole hours, minutes and seconds', () => {
    expect(durationParts(3 * 3600 + 15 * 60)).toEqual({
      hours: 3,
      minutes: 15,
      seconds: 0,
    })
    expect(durationParts(45 * 60)).toEqual({
      hours: 0,
      minutes: 45,
      seconds: 0,
    })
    expect(durationParts(42)).toEqual({ hours: 0, minutes: 0, seconds: 42 })
    expect(durationParts(-5)).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })
})

// specs/core/spec.md — both calendars are display-ready.
describe('dates', () => {
  it('formats the Masihi date for an explicit locale', () => {
    expect(formatDate('2026-10-18', 'ms')).toBe('18 Oktober 2026')
  })

  it('formats the day name for an explicit locale', () => {
    expect(formatWeekday('2026-10-18', 'ms')).toBe('Ahad')
    expect(formatWeekday('2026-10-18', 'en')).toBe('Sunday')
  })

  it('formats a short day name for compact tables', () => {
    expect(formatWeekday('2026-10-18', 'ms', 'short')).toBe('Ahd')
    expect(formatWeekday('2026-10-18', 'en', 'short')).toBe('Sun')
  })

  it('formats the day of the month without the month name', () => {
    expect(formatDayNumber('2026-10-18', 'ms')).toBe('18')
    expect(formatDayNumber('2026-10-01', 'ms')).toBe('1')
    expect(formatDayNumber('2026-10-18', 'ar')).toBe('١٨')
  })

  it('uses the source Hijri date verbatim when present', () => {
    expect(
      formatHijriDate('2026-10-18', 'ms', '7 Jamadilawal 1448 H'),
    ).toBe('7 Jamadilawal 1448 H')
  })

  it('derives a Hijri date when the source has none', () => {
    expect(formatHijriDate('2026-10-18', 'ms')).toBe('7 Jamadilawal 1448 H')
  })
})

// specs/core/spec.md — Arabic-script locales format in their own script.
describe('arabic-script locales', () => {
  it('formats the Masihi date and weekday in Arabic with Arabic-Indic digits', () => {
    expect(formatDate('2026-10-18', 'ar')).toBe('١٨ أكتوبر ٢٠٢٦')
    expect(formatWeekday('2026-10-18', 'ar')).toBe('الأحد')
  })

  it('formats Jawi Malay dates in Arabic script with Arabic-Indic digits', () => {
    expect(formatDate('2026-10-18', 'ms-Arab')).toBe('١٨ اوکتوبر ٢٠٢٦')
    expect(formatWeekday('2026-10-18', 'ms-Arab')).toBe('احد')
  })

  it('formats times with Arabic-Indic digits', () => {
    expect(formatTime(4 * 60 + 47, 'ar')).toBe('٠٤:٤٧')
    expect(formatTime(4 * 60 + 47, 'ms-Arab')).toBe('٠٤:٤٧')
  })

  it('formats plain numbers with Arabic-Indic digits', () => {
    expect(formatNumber(15, 'ar')).toBe('١٥')
    expect(formatNumber(15, 'ms-Arab')).toBe('١٥')
    expect(formatNumber(15, 'ms')).toBe('15')
    expect(formatNumber(15, 'en')).toBe('15')
  })

  it('rewrites a Malay Hijri date into Arabic script and digits', () => {
    const hijri = '7 Jamadilawal 1448 H'
    expect(formatHijriDate('2026-10-18', 'ar', hijri)).toBe(
      '٧ جمادى الأولى ١٤٤٨ هـ',
    )
    expect(formatHijriDate('2026-10-18', 'ms-Arab', hijri)).toBe(
      '٧ جمادى الأولى ١٤٤٨ هـ',
    )
  })

  it('derives an Arabic-script Hijri date when the source has none', () => {
    expect(formatHijriDate('2026-10-18', 'ar')).toContain('جمادى')
  })

  it('leaves Latin locales untouched', () => {
    expect(
      formatHijriDate('2026-10-18', 'en', '7 Jamadilawal 1448 H'),
    ).toBe('7 Jamadilawal 1448 H')
    expect(formatTime(4 * 60 + 47, 'en')).toBe('04:47')
    expect(formatDate('2026-10-18', 'ms')).toBe('18 Oktober 2026')
  })
})

// specs/core/spec.md — month helpers for the monthly view.
describe('month helpers', () => {
  it('reads the month of an ISO date', () => {
    expect(monthOf('2026-10-18')).toBe('2026-10')
  })

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-10', 1)).toBe('2026-11')
  })

  it('lists every date in a month, leap years included', () => {
    expect(monthDates('2026-10')).toHaveLength(31)
    expect(monthDates('2026-10')[0]).toBe('2026-10-01')
    expect(monthDates('2026-10').at(-1)).toBe('2026-10-31')
    expect(monthDates('2024-02')).toHaveLength(29)
    expect(monthDates('2026-02')).toHaveLength(28)
  })

  it('formats a month name for a locale', () => {
    expect(formatMonth('2026-10', 'en')).toBe('October 2026')
    expect(formatMonth('2026-10', 'ms')).toBe('Oktober 2026')
    expect(formatMonth('2026-10', 'ar')).toContain('٢٠٢٦')
  })
})

// specs/core/spec.md — trend chart range helpers.
describe('chart ranges', () => {
  it('shifts an ISO date across month boundaries', () => {
    expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01')
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31')
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('lists an inclusive date range', () => {
    expect(rangeDates('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
  })

  it('bounds a week Monday-first', () => {
    expect(chartBounds('2026-10-21', 'week')).toEqual({
      start: '2026-10-19',
      end: '2026-10-25',
    })
  })

  it('bounds a month and a year', () => {
    expect(chartBounds('2026-10-21', 'month')).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    })
    expect(chartBounds('2026-10-21', 'year')).toEqual({
      start: '2026-01-01',
      end: '2026-12-31',
    })
  })

  it('steps a range anchor by week, month or year', () => {
    expect(shiftChartDate('2026-10-21', 'week', 1)).toBe('2026-10-28')
    expect(shiftChartDate('2026-10-21', 'month', -1)).toBe('2026-09-01')
    expect(shiftChartDate('2026-10-21', 'year', 1)).toBe('2027-10-21')
  })

  it('flags the range containing today as current', () => {
    expect(chartIsCurrent('2026-10-21', 'month', '2026-10-02')).toBe(true)
    expect(chartIsCurrent('2026-09-21', 'month', '2026-10-02')).toBe(false)
  })

  it('formats a compact day + month label', () => {
    expect(formatShortDate('2026-10-21', 'en')).toBe('Oct 21')
    expect(formatShortDate('2026-10-21', 'ms')).toBe('21 Okt')
  })
})

// specs/core/spec.md — off-scale chart values are detected against the median.
describe('chart outliers', () => {
  it('finds the median of the present values only', () => {
    expect(chartMedian([1080, null, 1090, 1070])).toBe(1080)
    expect(chartMedian([1080, 1090])).toBe(1085)
    expect(chartMedian([null, null])).toBeNull()
  })

  it('flags a value far from the median and keeps normal variation', () => {
    expect(isChartOutlier(930, 1080)).toBe(true)
    expect(isChartOutlier(1110, 1080)).toBe(false)
  })
})

// specs/core/spec.md — the chart period label names the selected range.
describe('formatChartPeriod', () => {
  it('names a month, a year and a week span', () => {
    expect(formatChartPeriod('2026-10-15', 'month', 'en')).toBe('October 2026')
    expect(formatChartPeriod('2026-10-15', 'year', 'en')).toBe('2026')
    expect(formatChartPeriod('2026-10-15', 'week', 'en')).toBe('Oct 12 – Oct 18')
  })

  it('localizes and stays within the range bounds', () => {
    expect(formatChartPeriod('2026-10-15', 'month', 'ms')).toBe('Oktober 2026')
    expect(formatChartPeriod('2026-01-01', 'week', 'en')).toBe('Dec 29 – Jan 4')
  })
})
