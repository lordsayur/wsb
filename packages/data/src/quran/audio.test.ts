import { describe, expect, it } from 'vitest'
import { ayahAudioUrl } from './audio.js'
import { QURAN_INDEX } from './index.js'

// specs/quran/spec.md — one file per ayah, keyed by surah and ayah.
describe('ayahAudioUrl', () => {
  it('maps the first and last ayah to their files', () => {
    expect(ayahAudioUrl(QURAN_INDEX, { surah: 1, ayah: 1 })).toMatch(
      /\/001001\.mp3$/,
    )
    expect(ayahAudioUrl(QURAN_INDEX, { surah: 114, ayah: 6 })).toMatch(
      /\/114006\.mp3$/,
    )
  })

  it('pads three digits per part', () => {
    expect(ayahAudioUrl(QURAN_INDEX, { surah: 2, ayah: 255 })).toMatch(
      /\/002255\.mp3$/,
    )
  })

  it('returns null outside the corpus', () => {
    expect(ayahAudioUrl(QURAN_INDEX, { surah: 115, ayah: 1 })).toBeNull()
    expect(ayahAudioUrl(QURAN_INDEX, { surah: 1, ayah: 8 })).toBeNull()
  })
})
