// specs/tui/spec.md — presentation only: turns a view into lines of text.
// No terminal I/O here, so the frame can be tested without a tty.
import { LOCALE_LABELS, t, type Locale } from './i18n.js'
import type { TuiSettings } from './settings.js'
import type { DayView } from './view.js'

export interface FrameOptions {
  columns: number
  rows: number
  showHelp: boolean
  unavailable: boolean
  loading: boolean
  source: string
  color?: boolean
}

const RESET = '\u001b[0m'
const BOLD = '\u001b[1m'
const DIM = '\u001b[2m'

function paint(text: string, code: string, color: boolean): string {
  return color ? `${code}${text}${RESET}` : text
}

/** Pads the label so the time sits in a right-hand column. */
function rowLine(
  label: string,
  time: string,
  marker: string,
  width: number,
  color: boolean,
  emphasis: 'current' | 'next' | 'none',
): string {
  const inner = Math.max(10, width - 2)
  const gap = Math.max(1, inner - visibleWidth(label) - visibleWidth(time))
  const body = `${label}${' '.repeat(gap)}${time}`
  if (emphasis === 'current') return paint(`${marker} ${body}`, BOLD, color)
  if (emphasis === 'next') return paint(`${marker} ${body}`, DIM, color)
  return `${marker} ${body}`
}

/** Visible width of a string, ignoring ANSI escape sequences. */
export function visibleWidth(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, '').length
}

/** One-line status for the footer keys. */
export function helpLine(settings: TuiSettings, showHelp: boolean): string {
  const locale = settings.locale
  const parts = [
    `${t(locale, 'tui.key.district')}`,
    `${t(locale, 'tui.key.language')}`,
    `${t(locale, 'tui.key.format')}`,
    `${t(locale, 'tui.key.reload')}`,
    `${t(locale, 'tui.key.quit')}`,
  ]
  return showHelp ? parts.join('  ·  ') : t(locale, 'tui.key.hint')
}

export function localeName(locale: Locale): string {
  return LOCALE_LABELS[locale]
}

/** Renders the full frame as lines; the caller paints them to the tty. */
export function renderFrame(
  view: DayView | null,
  settings: TuiSettings,
  options: FrameOptions,
): string[] {
  const locale = settings.locale
  const width = Math.max(28, Math.min(options.columns - 2, 64))
  const lines: string[] = []
  const margin = '  '
  const rule = margin + '─'.repeat(width)

  lines.push('')
  lines.push(margin + t(locale, 'meta.title'))
  lines.push(rule)

  if (!view) {
    lines.push('')
    lines.push(
      margin +
        t(locale, options.loading ? 'state.loading' : 'state.unavailable'),
    )
    lines.push('')
    lines.push(rule)
    lines.push(margin + `${t(locale, 'source.label')}: ${options.source}`)
    lines.push(margin + helpLine(settings, options.showHelp))
    return lines
  }

  lines.push(margin + `${view.weekday}  ·  ${view.masihi}`)
  lines.push(margin + view.hijri)
  lines.push('')
  lines.push(margin + view.next)
  if (view.stale) {
    lines.push('')
    lines.push(margin + t(locale, 'state.offline'))
  }
  lines.push(rule)

  const gutter = ' '
  const color = options.color === true
  for (const row of view.rows) {
    const marker = row.current ? '▸' : row.next ? '›' : gutter
    lines.push(
      margin +
        rowLine(
          row.label,
          row.time,
          marker,
          width,
          color,
          row.current ? 'current' : row.next ? 'next' : 'none',
        ),
    )
  }

  lines.push(rule)
  lines.push(
    margin +
      `${t(locale, 'district.label')}: ${t(locale, `district.${settings.district}`)}` +
      `  ·  ${localeName(settings.locale)}` +
      `  ·  ${t(locale, `settings.timeFormat.${settings.timeFormat === '12h' ? 'h12' : 'h24'}`)}`,
  )
  lines.push(rule)
  lines.push(margin + `${t(locale, 'source.label')}: ${options.source}`)
  lines.push(margin + helpLine(settings, options.showHelp))

  const height = options.rows - 1
  if (lines.length > height) lines.length = height
  return lines
}

/** The piped, non-tty report: plain text, no escapes, no cursor tricks. */
export function plainReport(
  view: DayView,
  settings: TuiSettings,
  source: string,
): string {
  const locale = settings.locale
  const lines = [
    `${view.weekday}  ·  ${view.masihi}`,
    view.hijri,
    view.next,
    '',
  ]
  for (const row of view.rows) {
    const marker = row.current ? '*' : row.next ? '>' : ' '
    lines.push(`${marker} ${row.time}  ${row.label}`)
  }
  lines.push('')
  lines.push(`${t(locale, 'district.label')}: ${t(locale, `district.${settings.district}`)}`)
  lines.push(`${t(locale, 'source.label')}: ${source}`)
  if (view.stale) lines.push(t(locale, 'state.offline'))
  return lines.join('\n')
}

/** The `--json` payload: one object, stable keys, no formatting. */
export function jsonReport(
  view: DayView,
  settings: TuiSettings,
): string {
  return JSON.stringify({
    date: view.date,
    district: settings.district,
    locale: settings.locale,
    timeFormat: settings.timeFormat,
    hijriDate: view.hijri,
    current: view.currentPrayer,
    next: view.nextPrayer,
    secondsToNext: view.secondsToNext,
    stale: view.stale,
    entries: view.entries,
  })
}

