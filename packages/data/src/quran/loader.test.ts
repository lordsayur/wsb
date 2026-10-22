import { describe, expect, it, vi } from 'vitest'
import {
  QuranCorpus,
  QuranUnavailable,
  type JuzLoader,
} from './loader.js'
import { QURAN_INDEX } from './index.js'

// specs/quran/spec.md — the corpus adapter: bundled metadata, lazy per-juz
// text, one fetch per juz, unavailable state instead of a crash.

const chunk = (juz: number) => ({
  '1:1': `basmalah-${juz}`,
  '2:255': `ayat-kursi-${juz}`,
})

function loader() {
  return vi.fn<JuzLoader>(async (juz: number) => chunk(juz))
}

describe('QuranCorpus', () => {
  it('validates the bundled corpus', () => {
    expect(() => new QuranCorpus(loader(), QURAN_INDEX)).not.toThrow()
    expect(() => new QuranCorpus(loader(), { ...QURAN_INDEX, total: 1 }))
      .toThrow(/invalid Quran corpus/)
  })

  it('maps a reference to its juz', () => {
    const corpus = new QuranCorpus(loader())
    expect(corpus.juzOf({ surah: 1, ayah: 1 })).toMatchObject({ juz: 1, index: 0 })
    expect(corpus.juzOf({ surah: 2, ayah: 255 })).toMatchObject({ juz: 3 })
    expect(corpus.juzOf({ surah: 115, ayah: 1 })).toBeNull()
  })

  it('fetches each juz once, even under concurrency', async () => {
    const load = loader()
    const corpus = new QuranCorpus(load)
    const [a, b] = await Promise.all([
      corpus.text({ surah: 1, ayah: 1 }),
      corpus.text({ surah: 1, ayah: 1 }),
    ])
    expect(a).toBe('basmalah-1')
    expect(b).toBe('basmalah-1')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('returns null for a reference outside the corpus', async () => {
    const corpus = new QuranCorpus(loader())
    expect(await corpus.text({ surah: 1, ayah: 8 })).toBeNull()
  })

  it('reports an unavailable juz instead of throwing raw', async () => {
    const failing = vi.fn<JuzLoader>(async () => {
      throw new Error('offline')
    })
    const corpus = new QuranCorpus(failing)
    await expect(corpus.text({ surah: 1, ayah: 1 })).rejects.toBeInstanceOf(
      QuranUnavailable,
    )
    expect(failing).toHaveBeenCalledTimes(1)
  })

  it('retries a failed juz on the next reveal', async () => {
    let attempts = 0
    const flaky = vi.fn<JuzLoader>(async (juz: number) => {
      attempts += 1
      if (attempts === 1) throw new Error('offline')
      return chunk(juz)
    })
    const corpus = new QuranCorpus(flaky)
    await expect(corpus.text({ surah: 1, ayah: 1 })).rejects.toBeInstanceOf(
      QuranUnavailable,
    )
    expect(await corpus.text({ surah: 1, ayah: 1 })).toBe('basmalah-1')
    expect(flaky).toHaveBeenCalledTimes(2)
  })

  it('loads a passage in order, one fetch per distinct juz', async () => {
    const load = loader()
    const corpus = new QuranCorpus(load)
    const refs = [
      { surah: 1, ayah: 1 },
      { surah: 2, ayah: 255 },
    ]
    expect(await corpus.texts(refs)).toEqual(['basmalah-1', 'ayat-kursi-3'])
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('swallows preload failures', async () => {
    const failing = vi.fn<JuzLoader>(async () => {
      throw new Error('offline')
    })
    await expect(new QuranCorpus(failing).preload(1)).resolves.toBeUndefined()
  })
})
