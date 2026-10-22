// specs/tui/spec.md — settings persisted on the device. Only shell
// preferences live here; the district is stored through the data port's
// selection contract.
import {
  DEFAULT_DISTRICT,
  DEFAULT_TIME_FORMAT,
  isTimeFormat,
  resolveDistrict,
  type District,
  type TimeFormat,
} from '@wsb/core'
import { isLocale, type Locale } from './i18n.js'

export interface TuiSettings {
  locale: Locale
  timeFormat: TimeFormat
  district: District
}

export const SETTINGS_KEY = 'wsb.tui.settings'

export const DEFAULT_SETTINGS: TuiSettings = {
  locale: 'ms',
  timeFormat: DEFAULT_TIME_FORMAT,
  district: DEFAULT_DISTRICT,
}

/** Resolves the raw stored preferences; never throws. */
export function resolveSettings(
  value: unknown,
  district: unknown = value && typeof value === 'object'
    ? (value as { district?: unknown }).district
    : undefined,
): TuiSettings {
  const stored = (value ?? {}) as Partial<TuiSettings>
  return {
    locale: isLocale(stored.locale) ? stored.locale : DEFAULT_SETTINGS.locale,
    timeFormat: isTimeFormat(stored.timeFormat)
      ? stored.timeFormat
      : DEFAULT_SETTINGS.timeFormat,
    district: resolveDistrict(district),
  }
}

/** Cycles to the next locale in the fixed order. */
export function nextLocale(locale: Locale): Locale {
  const index = ['ms', 'ms-Arab', 'ar', 'en'].indexOf(locale)
  return (['ms', 'ms-Arab', 'ar', 'en'] as const)[(index + 1) % 4]!
}

export function toggleTimeFormat(format: TimeFormat): TimeFormat {
  return format === '24h' ? '12h' : '24h'
}
