// specs/quran/spec.md — recitation adapter. One fixed reciter, one file per
// ayah, streamed on demand; audio is never bundled with the app.
import { indexOfAyah, type QuranIndex, type Ref } from '@wsb/core'

/** The reciter shipped for every ayah. */
export const AYAH_AUDIO_RECITER = 'Hudhaify' as const

export const AYAH_AUDIO_ATTRIBUTION = {
  source: 'EveryAyah.com',
  url: 'https://everyayah.com/',
  reciter: 'Ali Al-Hudhaify',
} as const

const BASE_URL = 'https://everyayah.com/data/Hudhaify_128kbps'

/**
 * The recitation file for one ayah (`SSSAAA.mp3`), or null when the reference
 * is outside the corpus. `index` is only needed for validation in tests.
 */
export function ayahAudioUrl(
  index: QuranIndex,
  ref: Ref,
  base = BASE_URL,
): string | null {
  if (indexOfAyah(index, ref) < 0) return null
  const surah = String(ref.surah).padStart(3, '0')
  const ayah = String(ref.ayah).padStart(3, '0')
  return `${base}/${surah}${ayah}.mp3`
}
