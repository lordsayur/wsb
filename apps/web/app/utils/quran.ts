// specs/quran/spec.md — presentation helpers. Domain identifiers are not
// translated; a surah's Arabic name is always shown, with the localized name
// beside it when the locale is not Arabic-script.
import type { QuranSura } from '@wsb/core'

const isArabicScript = (locale: string) => locale === 'ar' || locale === 'ms-Arab'

export function surahName(sura: QuranSura, locale: string): string {
  if (isArabicScript(locale)) return sura.ar
  return locale === 'en' ? sura.en : sura.ms
}

/** The Arabic name always, plus the localized name when not Arabic-script. */
export function surahDisplay(sura: QuranSura, locale: string): string {
  if (isArabicScript(locale)) return sura.ar
  return `${sura.ar} · ${surahName(sura, locale)}`
}
