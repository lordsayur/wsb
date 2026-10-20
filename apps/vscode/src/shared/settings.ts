// specs/vscode/spec.md — settings persisted in the editor configuration.
import {
  DEFAULT_DISTRICT,
  DEFAULT_TIME_FORMAT,
  isTimeFormat,
  resolveDistrict,
  type District,
  type TimeFormat,
} from '@wsb/core'
import type { Locale } from './i18n.js'

export interface ExtensionSettings {
  statusBar: boolean
  notifications: boolean
  locale: Locale
  timeFormat: TimeFormat
  district: District
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  statusBar: true,
  notifications: false,
  locale: 'ms',
  timeFormat: DEFAULT_TIME_FORMAT,
  district: DEFAULT_DISTRICT,
}

const LOCALES: readonly Locale[] = ['ms', 'ms-Arab', 'ar', 'en']

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Resolves the raw `wsb.*` configuration values into settings. */
export function resolveSettings(value: unknown): ExtensionSettings {
  const stored = (value ?? {}) as Partial<ExtensionSettings>
  return {
    statusBar: stored.statusBar !== false,
    notifications: stored.notifications === true,
    locale: isLocale(stored.locale) ? stored.locale : 'ms',
    timeFormat: isTimeFormat(stored.timeFormat)
      ? stored.timeFormat
      : DEFAULT_SETTINGS.timeFormat,
    district: resolveDistrict(stored.district),
  }
}
