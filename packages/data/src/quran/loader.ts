// specs/quran/spec.md — corpus adapter. Metadata is bundled; ayah text is
// fetched one juz chunk at a time through an injected loader, so the shell
// decides how the bytes arrive and the data port stays backend-agnostic.
import {
  ayahAt,
  checkIndex,
  indexOfAyah,
  juzOfIndex,
  type AyahRef,
  type QuranIndex,
  type Ref,
} from '@wsb/core'
import { QURAN_INDEX } from './index.js'

/** One juz chunk, keyed by `"surah:ayah"`. */
export type JuzText = Readonly<Record<string, string>>

/** Fetches one juz chunk; rejects when the corpus is unavailable. */
export type JuzLoader = (juz: number) => Promise<JuzText>

export const QURAN_ATTRIBUTION = {
  source: 'Tanzil.net',
  url: 'https://tanzil.net/download/',
  text: 'Uthmani (Hafs)',
} as const

export class QuranCorpus {
  readonly index: QuranIndex
  readonly #loadJuz: JuzLoader
  readonly #chunks = new Map<number, Promise<JuzText>>()

  constructor(loadJuz: JuzLoader, index: QuranIndex = QURAN_INDEX) {
    const problem = checkIndex(index)
    if (problem) throw new Error(`invalid Quran corpus: ${problem}`)
    this.index = index
    this.#loadJuz = loadJuz
  }

  /** The juz (1–30) holding a reference; null when the reference is invalid. */
  juzOf(ref: Ref): AyahRef | null {
    const global = indexOfAyah(this.index, ref)
    if (global < 0) return null
    const at = ayahAt(this.index, global)
    return at ? { ...at, juz: juzOfIndex(this.index, global) } : null
  }

  /** Loads a chunk once; repeated calls share the same in-flight promise. */
  chunk(juz: number): Promise<JuzText> {
    const cached = this.#chunks.get(juz)
    if (cached) return cached
    const pending = this.#loadJuz(juz)
    this.#chunks.set(juz, pending)
    pending.catch(() => this.#chunks.delete(juz))
    return pending
  }

  /** The Arabic text of one ayah; null when the reference is out of range. */
  async text(ref: Ref): Promise<string | null> {
    const at = this.juzOf(ref)
    if (!at) return null
    let chunk: JuzText
    try {
      chunk = await this.chunk(at.juz)
    } catch {
      throw new QuranUnavailable(at.juz)
    }
    return chunk[`${at.surah}:${at.ayah}`] ?? null
  }

  /** Texts for a passage, in order; loads each distinct juz once. */
  async texts(refs: readonly Ref[]): Promise<(string | null)[]> {
    return Promise.all(refs.map((ref) => this.text(ref)))
  }

  /** Warms the chunk for a juz so a later reveal feels instant. */
  async preload(juz: number): Promise<void> {
    try {
      await this.chunk(juz)
    } catch {
      // Preloading is best-effort; the reveal retries and reports failure.
    }
  }
}

export class QuranUnavailable extends Error {
  constructor(readonly juz: number) {
    super(`Quran juz ${juz} is unavailable`)
    this.name = 'QuranUnavailable'
  }
}
