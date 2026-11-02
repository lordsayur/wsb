// specs/web/spec.md — the address carries the selection of a prayer-times page,
// so a link opens the same district, month, graph range and anchor.
import {
  DEFAULT_DISTRICT,
  isChartRange,
  isDistrict,
  type ChartRange,
  type District,
} from '@wsb/core'

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

/** Route query values may repeat; the first string wins. */
export function queryValue(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export function parseMonth(value: unknown): string | null {
  const text = queryValue(value)
  return text && MONTH.test(text) ? text : null
}

export function parseDate(value: unknown): string | null {
  const text = queryValue(value)
  if (!text || !DATE.test(text)) return null
  const [year, month, day] = text.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? text
    : null
}

export function parseDistrict(value: unknown): District | null {
  const text = queryValue(value)
  return isDistrict(text) ? text : null
}

export function parseRange(value: unknown): ChartRange | null {
  const text = queryValue(value)
  return isChartRange(text) ? text : null
}

/**
 * specs/web/spec.md — the shortcut to every prayer time. One helper so the
 * summary, the week slide and the footer build the same URL, and the default
 * district stays out of the address.
 */
export function prayerTimesLink(district: District | string): {
  path: string
  query?: { district: string }
} {
  return district === DEFAULT_DISTRICT
    ? { path: '/prayer-times' }
    : { path: '/prayer-times', query: { district } }
}
