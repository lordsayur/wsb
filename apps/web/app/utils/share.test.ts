import { describe, expect, it } from 'vitest'
import { buildShareText } from './share'

// specs/web/spec.md — share text: Brunei & Muara times, offsets, live URL.
const t = (key: string, named: Record<string, unknown> = {}) =>
  ({
    'share.title': 'Waktu Sembahyang Brunei',
    'share.district': 'Daerah: Brunei dan Muara',
    'share.line': `${named.prayer}: ${named.time}`,
    'share.offsets': 'Tambah 1 minit untuk Tutong dan 3 minit untuk Belait.',
    'prayer.subuh': 'Subuh',
    'prayer.isyak': 'Isyak',
  })[key] ?? key

const input = {
  entries: [
    { prayer: 'subuh' as const, minutes: 4 * 60 + 50 },
    { prayer: 'isyak' as const, minutes: 19 * 60 + 20 },
  ],
  date: '2026-10-18',
  hijri: '7 Jamadilawal 1448 H',
  locale: 'ms',
  url: 'https://wsb.example',
  t,
}

describe('buildShareText', () => {
  it('formats with day, Masihi and Hijri on separate lines', () => {
    expect(buildShareText(input)).toBe(
      [
        'Waktu Sembahyang Brunei',
        'Daerah: Brunei dan Muara',
        '',
        'Ahad',
        '',
        '18 Oktober 2026',
        '7 Jamadilawal 1448 H',
        '',
        'Subuh: 04:50',
        'Isyak: 19:20',
        '',
        'Tambah 1 minit untuk Tutong dan 3 minit untuk Belait.',
        '',
        'https://wsb.example',
      ].join('\n'),
    )
  })

  it('renders raw format as one dense block', () => {
    expect(buildShareText({ ...input, format: 'raw' })).toBe(
      [
        'Waktu Sembahyang Brunei',
        'Ahad, 18 Oktober 2026 | 7 Jamadilawal 1448 H',
        'Subuh: 04:50',
        'Isyak: 19:20',
        'Tambah 1 minit untuk Tutong dan 3 minit untuk Belait.',
        'https://wsb.example',
      ].join('\n'),
    )
  })

  it('omits the Hijri line when the source has none', () => {
    const text = buildShareText({ ...input, hijri: '' })
    expect(text).not.toContain('\n\n7 Jamadilawal')
    expect(text).toContain('18 Oktober 2026\n\nSubuh')
  })
})

describe('buildShareText time format', () => {
  it('renders 12-hour times when asked', () => {
    const text = buildShareText({
      ...input,
      locale: 'en-US',
      timeFormat: '12h',
    })
    expect(text).toContain('Subuh: 04:50 AM')
    expect(text).toContain('Isyak: 07:20 PM')
  })
})
