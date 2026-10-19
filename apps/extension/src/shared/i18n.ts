// specs/extension/spec.md — reuse the web shell's message catalogues so a key
// added there exists everywhere. Malay is the default; English the fallback.
import ms from '../../../web/i18n/locales/ms.json'
import en from '../../../web/i18n/locales/en.json'

export type Locale = 'ms' | 'en'

const MESSAGES: Record<Locale, Record<string, unknown>> = { ms, en }

function lookup(locale: Locale, key: string): string | undefined {
  const parts = key.split('.')
  const walk = (source: unknown): unknown =>
    parts.reduce<unknown>(
      (value, part) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)[part]
          : undefined,
      source,
    )
  const value = walk(MESSAGES[locale])
  if (typeof value === 'string') return value
  const fallback = walk(MESSAGES.en)
  return typeof fallback === 'string' ? fallback : undefined
}

/** Resolves a translation key, interpolating `{name}` placeholders. */
export function t(
  locale: Locale,
  key: string,
  args: Record<string, string | number> = {},
): string {
  const template = lookup(locale, key) ?? key
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in args ? String(args[name]) : match,
  )
}
