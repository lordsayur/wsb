// specs/quran/spec.md — presentation helpers. Domain identifiers are not
// translated; only the display label for a surah depends on the locale.
import type { QuranSura } from '@wsb/core'

export function surahName(sura: QuranSura, locale: string): string {
  if (locale === 'ar' || locale === 'ms-Arab') return sura.ar
  return locale === 'en' ? sura.en : sura.ms
}
