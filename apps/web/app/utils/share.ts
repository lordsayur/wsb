import {
  DEFAULT_TIME_FORMAT,
  formatDate,
  formatTime,
  formatWeekday,
} from '@wsb/core'
import type { PrayerEntry, TimeFormat } from '@wsb/core'

export type ShareFormat = 'formatted' | 'raw'

export interface ShareTextInput {
  entries: readonly PrayerEntry[]
  date: string
  hijri: string
  locale: string
  url: string
  format?: ShareFormat
  timeFormat?: TimeFormat
  t: (key: string, named?: Record<string, unknown>) => string
}

/** Builds the share summary copied by the share button, formatted or raw. */
export function buildShareText(input: ShareTextInput): string {
  const format = input.format ?? 'formatted'
  const date = formatWeekday(input.date, input.locale)
  const masihi = formatDate(input.date, input.locale)
  const hijri = input.hijri.trim()
  const rows = input.entries.map((entry) =>
    input.t('share.line', {
      prayer: input.t(`prayer.${entry.prayer}`),
      time: formatTime(
        entry.minutes,
        input.locale,
        input.timeFormat ?? DEFAULT_TIME_FORMAT,
      ),
    }),
  )

  if (format === 'raw') {
    return [
      input.t('share.title'),
      [`${date}, ${masihi}`, hijri].filter(Boolean).join(' | '),
      ...rows,
      input.t('share.offsets'),
      input.url,
    ].join('\n')
  }

  return [
    input.t('share.title'),
    input.t('share.district'),
    '',
    date,
    '',
    masihi,
    ...(hijri ? [hijri] : []),
    '',
    ...rows,
    '',
    input.t('share.offsets'),
    '',
    input.url,
  ].join('\n')
}
