// specs/extension/spec.md — extension settings, persisted in chrome.storage.
import type { TimeFormat } from '@wsb/core'
import { DEFAULT_TIME_FORMAT, DEFAULT_DISTRICT, resolveDistrict, isTimeFormat, type District } from '@wsb/core'

export interface ExtensionSettings {
  notifications: boolean
  header: boolean
  locale: 'ms' | 'en'
  timeFormat: TimeFormat
  district: District
}

export const SETTINGS_KEY = 'wsb.extension.settings'

export const DEFAULT_SETTINGS: ExtensionSettings = {
  notifications: false,
  header: true,
  locale: 'ms',
  timeFormat: DEFAULT_TIME_FORMAT,
  district: DEFAULT_DISTRICT,
}

export function resolveSettings(value: unknown): ExtensionSettings {
  const stored = (value ?? {}) as Partial<ExtensionSettings>
  return {
    notifications: stored.notifications === true,
    header: stored.header !== false,
    locale: stored.locale === 'en' ? 'en' : 'ms',
    timeFormat: isTimeFormat(stored.timeFormat)
      ? stored.timeFormat
      : DEFAULT_SETTINGS.timeFormat,
    district: resolveDistrict(stored.district),
  }
}

export async function getSettings(): Promise<ExtensionSettings> {
  const values = await chrome.storage.local.get(SETTINGS_KEY)
  return resolveSettings(values[SETTINGS_KEY])
}

export async function saveSettings(
  next: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const merged = { ...(await getSettings()), ...next }
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged })
  return merged
}
