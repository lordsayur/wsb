import { describe, expect, it } from 'vitest'
import {
  JUZ_COUNT,
  QURAN_TOTAL,
  SURA_COUNT,
  WHOLE_QURAN,
  ayahAt,
  checkIndex,
  initialReveal,
  indexOfAyah,
  juzOfIndex,
  nextAyah,
  normalizeRange,
  passage,
  scopeRange,
  pickAyah,
  rangeBounds,
  rangeCount,
  reveal,
  revealAll,
  revealNext,
  searchSurah,
  type AyahRange,
  type QuranIndex,
} from './quran.js'

// specs/quran/spec.md — core logic over an injected corpus. The real corpus is
// checked in packages/data; this fixture keeps core independent of it.

const sura = (n: number, ayahs: number, latin: string, ms: string, en: string) => ({
  n, ayahs, latin, ms, en, ar: `سورة ${n}`,
})

// 6 ayahs + 5 + 4 + 3 + 2 = 20 ayahs; juz 1 covers 0..9, juz 2 covers 10..19.
const FIXTURE: QuranIndex = {
  total: 20,
  suras: [
    sura(1, 6, 'Al-Faatiha', 'Al-Fatihah', 'The Opening'),
    sura(2, 5, 'Al-Baqara', 'Al-Baqarah', 'The Cow'),
    sura(3, 4, 'Aal-i-Imraan', "Ali 'Imran", 'The Family of Imraan'),
    sura(4, 3, 'An-Nisaa', "An-Nisa'", 'The Women'),
    sura(5, 2, 'Al-Maaida', "Al-Ma'idah", 'The Table'),
  ],
  juzs: [
    { juz: 1, surah: 1, ayah: 1, start: 0, count: 10 },
    { juz: 2, surah: 2, ayah: 5, start: 10, count: 10 },
  ],
}

const range = (partial: Partial<AyahRange>): AyahRange => ({
  juzMin: 1, juzMax: 2, surahMin: 1, surahMax: 5, ...partial,
})

describe('index', () => {
  it('round-trips surah/ayah through the global index', () => {
    expect(indexOfAyah(FIXTURE, { surah: 1, ayah: 1 })).toBe(0)
    expect(indexOfAyah(FIXTURE, { surah: 2, ayah: 1 })).toBe(6)
    expect(ayahAt(FIXTURE, 0)).toMatchObject({ surah: 1, ayah: 1, juz: 1, index: 0 })
    expect(ayahAt(FIXTURE, 19)).toMatchObject({ surah: 5, ayah: 2, juz: 2 })
    expect(ayahAt(FIXTURE, 20)).toBeNull()
    expect(ayahAt(FIXTURE, -1)).toBeNull()
  })

  it('rejects out-of-range refs', () => {
    expect(indexOfAyah(FIXTURE, { surah: 1, ayah: 7 })).toBe(-1)
    expect(indexOfAyah(FIXTURE, { surah: 6, ayah: 1 })).toBe(-1)
    expect(indexOfAyah(FIXTURE, { surah: 1, ayah: 0 })).toBe(-1)
  })

  it('maps ayahs to juz across the boundary', () => {
    expect(juzOfIndex(FIXTURE, 9)).toBe(1)
    expect(juzOfIndex(FIXTURE, 10)).toBe(2)
    expect(juzOfIndex(FIXTURE, 19)).toBe(2)
  })

  it('reports a bad corpus', () => {
    expect(checkIndex(FIXTURE)).toBe('expected 114 surahs')
  })
})

describe('range', () => {
  it('defaults to the whole corpus', () => {
    expect(rangeCount(FIXTURE, range({}))).toBe(20)
    expect(rangeBounds(FIXTURE, range({}))).toEqual({ start: 0, end: 19 })
  })

  it('allows a single juz or a single surah', () => {
    expect(rangeCount(FIXTURE, range({ juzMin: 1, juzMax: 1 }))).toBe(10)
    expect(rangeCount(FIXTURE, range({ surahMin: 2, surahMax: 2 }))).toBe(5)
    expect(rangeCount(FIXTURE, range({ juzMin: 2, juzMax: 2, surahMin: 3, surahMax: 3 })))
      .toBe(4)
  })

  it('intersects juz and surah exactly', () => {
    const both = range({ juzMin: 2, juzMax: 2, surahMin: 4, surahMax: 5 })
    expect(rangeBounds(FIXTURE, both)).toEqual({ start: 15, end: 19 })
    expect(rangeCount(FIXTURE, both)).toBe(5)
  })

  it('is empty when nothing intersects', () => {
    const empty = range({ juzMin: 2, juzMax: 2, surahMin: 1, surahMax: 1 })
    expect(rangeBounds(FIXTURE, empty)).toBeNull()
    expect(rangeCount(FIXTURE, empty)).toBe(0)
    expect(pickAyah(FIXTURE, empty)).toBeNull()
  })

  it('clamps and orders a range', () => {
    expect(normalizeRange({ juzMin: 0, juzMax: 99, surahMin: 5, surahMax: 1 }))
      .toEqual({ juzMin: 1, juzMax: JUZ_COUNT, surahMin: 1, surahMax: 5 })
    expect(normalizeRange(WHOLE_QURAN)).toEqual(WHOLE_QURAN)
  })
})

describe('scope', () => {
  it('turns one scope into one range', () => {
    expect(scopeRange({ kind: 'all' })).toEqual(WHOLE_QURAN)
    expect(scopeRange({ kind: 'juz', juz: 3 }))
      .toEqual({ juzMin: 3, juzMax: 3, surahMin: 1, surahMax: SURA_COUNT })
    expect(scopeRange({ kind: 'surah', surah: 18 }))
      .toEqual({ juzMin: 1, juzMax: JUZ_COUNT, surahMin: 18, surahMax: 18 })
  })

  it('clamps a scope into the corpus', () => {
    expect(scopeRange({ kind: 'juz', juz: 0 }).juzMin).toBe(1)
    expect(scopeRange({ kind: 'juz', juz: 99 }).juzMax).toBe(JUZ_COUNT)
    expect(scopeRange({ kind: 'surah', surah: 999 }).surahMax).toBe(SURA_COUNT)
  })

  it('never combines juz and surah', () => {
    const juz = scopeRange({ kind: 'juz', juz: 2 })
    expect(juz.surahMin).toBe(1)
    expect(juz.surahMax).toBe(SURA_COUNT)
    const surah = scopeRange({ kind: 'surah', surah: 2 })
    expect(surah.juzMin).toBe(1)
    expect(surah.juzMax).toBe(JUZ_COUNT)
  })

  it('keeps a surah scope inside that surah for next', () => {
    const only = scopeRange({ kind: 'surah', surah: 2 })
    expect(rangeCount(FIXTURE, only)).toBe(5)
    expect(nextAyah(FIXTURE, { surah: 2, ayah: 5 }, only)).toBeNull()
    expect(pickAyah(FIXTURE, only, () => 0.99)!.surah).toBe(2)
  })
})

describe('pick', () => {
  it('is uniform per ayah inside the range', () => {
    const bounds = rangeBounds(FIXTURE, range({}))!
    const span = bounds.end - bounds.start + 1
    for (const r of [0, 0.25, 0.5, 0.999]) {
      const pick = pickAyah(FIXTURE, range({}), () => r)!
      expect(pick.index).toBe(bounds.start + Math.min(span - 1, Math.floor(r * span)))
    }
  })

  it('never leaves a single-surah filter', () => {
    const only = range({ surahMin: 3, surahMax: 3 })
    for (const r of [0, 0.5, 0.99]) {
      expect(pickAyah(FIXTURE, only, () => r)!.surah).toBe(3)
    }
  })
})

describe('next', () => {
  it('crosses a surah boundary', () => {
    expect(nextAyah(FIXTURE, { surah: 2, ayah: 5 }, range({})))
      .toMatchObject({ surah: 3, ayah: 1 })
    expect(nextAyah(FIXTURE, { surah: 4, ayah: 3 }, range({})))
      .toMatchObject({ surah: 5, ayah: 1 })
  })

  it('stops at the end of the range', () => {
    expect(nextAyah(FIXTURE, { surah: 1, ayah: 6 }, range({ surahMin: 1, surahMax: 1 })))
      .toBeNull()
    expect(nextAyah(FIXTURE, { surah: 5, ayah: 2 }, range({}))).toBeNull()
  })

  it('builds a passage one ayah at a time', () => {
    const refs = passage(FIXTURE, { surah: 1, ayah: 5 }, range({}), 3)
      .map((a) => `${a.surah}:${a.ayah}`)
    expect(refs).toEqual(['1:5', '1:6', '2:1', '2:2'])
    expect(passage(FIXTURE, { surah: 1, ayah: 1 }, range({}), 0)).toHaveLength(1)
  })
})

describe('reveal', () => {
  it('latches each kind independently', () => {
    let state = initialReveal()
    state = reveal(state, 'surah')
    state = reveal(state, 'juz')
    state = reveal(state, 'surah')
    expect(state).toEqual({ juz: true, surah: true, ayah: false, next: 0 })
    expect(revealAll(state)).toEqual({ juz: true, surah: true, ayah: true, next: 0 })
    expect(revealNext(revealNext(state)).next).toBe(2)
  })
})

describe('search', () => {
  const names = (query: string) => searchSurah(FIXTURE, query).map((s) => s.latin)

  it('puts an exact name first', () => {
    expect(names('baqarah')[0]).toBe('Al-Baqara')
    expect(names('maidah')[0]).toBe('Al-Maaida')
  })

  it('accepts a one-edit typo', () => {
    expect(names('baqoroh')[0]).toBe('Al-Baqara')
  })

  it('weights Malay and English names equally', () => {
    expect(names('women')[0]).toBe('An-Nisaa')
    expect(names('nisa')[0]).toBe('An-Nisaa')
  })

  it('returns every surah for an empty query', () => {
    expect(searchSurah(FIXTURE, '  ')).toHaveLength(5)
  })

  it('returns nothing for a hopeless query', () => {
    expect(searchSurah(FIXTURE, 'zzzzzzzz')).toHaveLength(0)
  })
})

describe('corpus constants', () => {
  it('describes the Madinah mushaf', () => {
    expect(QURAN_TOTAL).toBe(6236)
    expect(SURA_COUNT).toBe(114)
    expect(JUZ_COUNT).toBe(30)
  })
})
