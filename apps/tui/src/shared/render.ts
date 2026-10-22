// specs/tui/spec.md — presentation only: turns views into lines of text.
// No terminal I/O here, so frames are testable without a tty. Every frame is
// exactly `rows` lines of `columns` cells, so the shell always fills the screen.
import { DEFAULT_TIME_FORMAT, formatTime, type TimeFormat } from '@wsb/core'
import { LOCALE_LABELS, t, type Locale } from './i18n.js'
import {
  ACCENT,
  MUTED,
  RESET,
  colorize,
  prayerRgb,
} from './palette.js'
import type { TuiSettings } from './settings.js'
import type { DayView } from './view.js'
import { chooseMonthColumns, type MonthView } from './month.js'
import { plotTrend, type TrendView } from './trend.js'

export type ShellView = 'day' | 'month' | 'trend'

export interface FrameOptions {
  columns: number
  rows: number
  showHelp: boolean
  unavailable: boolean
  loading: boolean
  source: string
  color?: boolean
  /** Active tab; defaults to the day view. */
  view?: ShellView
  /** First visible month row, for scrolling. */
  monthScroll?: number
  /** Active locale, so a view can format without the settings object. */
  locale?: Locale
  /** Clock preference for axis labels. */
  timeFormat?: TimeFormat
}

const ANSI = /\u001b\[[0-9;]*m/g

/** Visible width of a string, ignoring ANSI escape sequences. */
export function visibleWidth(text: string): number {
  return text.replace(ANSI, '').length
}

/** Clips to `width` visible characters, keeping the escape sequences intact. */
export function clip(text: string, width: number): string {
  if (width <= 0) return ''
  let visible = 0
  let out = ''
  let index = 0
  while (index < text.length) {
    if (text[index] === '\u001b') {
      const match = /\u001b\[[0-9;]*m/y
      match.lastIndex = index
      const found = match.exec(text)
      if (found) {
        out += found[0]
        index += found[0].length
        continue
      }
    }
    if (visible >= width) break
    out += text[index]
    visible += 1
    index += 1
  }
  return out + RESET
}

/** Pads to `width` visible cells, clipping when the text is too long. */
export function pad(text: string, width: number): string {
  const visible = visibleWidth(text)
  if (visible > width) return clip(text, width)
  return text + ' '.repeat(width - visible)
}

function rule(width: number, color: boolean): string {
  return colorize('─'.repeat(Math.max(0, width)), { color, rgb: MUTED })
}

/** Joins `·`-separated parts, dropping whole trailing parts that do not fit. */
export function fitParts(parts: readonly string[], width: number): string {
  const kept: string[] = []
  for (const part of parts) {
    const next = [...kept, part].join('  ·  ')
    if (next.length > width) break
    kept.push(part)
  }
  return kept.length > 0 ? kept.join('  ·  ') : parts[0] ?? ''
}

/** One-line status for the footer keys. */
export function helpLine(
  settings: TuiSettings,
  showHelp: boolean,
  view: ShellView = 'day',
): string {
  const locale = settings.locale
  const parts = [
    `${t(locale, 'tui.key.district')}`,
    `${t(locale, 'tui.key.language')}`,
    `${t(locale, 'tui.key.format')}`,
    `${t(locale, 'tui.key.views')}`,
  ]
  if (view !== 'day') parts.push(t(locale, 'tui.key.range'), t(locale, 'tui.key.today'))
  parts.push(t(locale, 'tui.key.reload'), t(locale, 'tui.key.quit'))
  return showHelp ? parts.join('  ·  ') : t(locale, 'tui.key.hint')
}

export function localeName(locale: Locale): string {
  return LOCALE_LABELS[locale]
}

/** The `1 day · 2 month · 3 trend` tab strip. */
function tabs(settings: TuiSettings, active: ShellView, color: boolean): string {
  const locale = settings.locale
  const items: { view: ShellView; key: string; label: string }[] = [
    { view: 'day', key: '1', label: t(locale, 'tui.tab.day') },
    { view: 'month', key: '2', label: t(locale, 'tui.tab.month') },
    { view: 'trend', key: '3', label: t(locale, 'tui.tab.trend') },
  ]
  return items
    .map((item) => {
      const label = `${item.key} ${item.label}`
      return item.view === active
        ? colorize(label, { color, rgb: ACCENT, bold: true, reverse: color })
        : colorize(label, { color, rgb: MUTED })
    })
    .join('   ')
}

/** Header, body and footer, fitted to exactly `rows × columns`. */
function compose(
  body: string[],
  settings: TuiSettings,
  options: FrameOptions,
  width: number,
): string[] {
  const locale = settings.locale
  const color = options.color === true
  const active = options.view ?? 'day'
  const inner = Math.max(1, width - 2)

  const header = [
    ' ' + colorize(t(locale, 'meta.title'), { color, rgb: ACCENT, bold: true }),
    ' ' + rule(inner, color),
    ' ' + tabs(settings, active, color),
    ' ' + rule(inner, color),
  ]

  const meta = fitParts(
    [
      `${t(locale, 'district.label')}: ${t(locale, `district.${settings.district}`)}`,
      localeName(settings.locale),
      t(locale, `settings.timeFormat.${settings.timeFormat === '12h' ? 'h12' : 'h24'}`),
    ],
    inner,
  )
  const footer = [
    ' ' + rule(inner, color),
    ' ' + colorize(meta, { color, rgb: MUTED }),
    ' ' + colorize(`${t(locale, 'source.label')}: ${options.source}`, { color, rgb: MUTED, dim: true }),
    ' ' + colorize(helpLine(settings, options.showHelp, active), { color, rgb: MUTED }),
  ]

  const room = Math.max(1, options.rows - header.length - footer.length)
  const shown = body.slice(0, room)

  // Centre the content block both ways; the frame itself always fills the
  // terminal, so a wide window gets a centred block rather than a left margin.
  const natural = Math.max(0, ...shown.map((line) => visibleWidth(line)))
  const left = Math.max(0, Math.floor((width - natural) / 2))
  const top = Math.floor((room - shown.length) / 2)

  const fitted: string[] = Array.from({ length: room }, () => '')
  shown.forEach((line, index) => {
    fitted[top + index] = ' '.repeat(left) + line
  })

  return [...header, ...fitted, ...footer].map((line) => pad(line, width))
}

/** The day body: date block, countdown and the eight rows. */
function dayBody(view: DayView | null, options: FrameOptions): string[] {
  const color = options.color === true
  if (!view) {
    return ['', colorize(t(options.locale ?? 'ms', options.loading ? 'state.loading' : 'state.unavailable'), { color, rgb: MUTED })]
  }

  const lines: string[] = [
    colorize(`${view.weekday}  ·  ${view.masihi}`, { color, bold: true }) +
      colorize(`   ${view.hijri}`, { color, rgb: MUTED }),
    colorize(view.next, { color, rgb: ACCENT }),
  ]
  if (view.stale) {
    lines.push(colorize(t(options.locale ?? 'ms', 'state.offline'), { color, rgb: MUTED }))
  }
  lines.push('')

  const timeWidth = Math.max(...view.rows.map((row) => visibleWidth(row.time)))
  for (const row of view.rows) {
    const marker = row.current ? '▸' : row.next ? '›' : ' '
    const label = pad(row.label, 12)
    const time = pad(row.time, timeWidth)
    const text = `${marker} ${label}${time}`
    if (row.current) {
      lines.push(colorize(text, { color, rgb: prayerRgb(row.prayer), bold: true, reverse: color }))
    } else if (row.next) {
      lines.push(colorize(text, { color, rgb: prayerRgb(row.prayer), bold: true }))
    } else {
      lines.push('  ' + label + colorize(time, { color, rgb: prayerRgb(row.prayer) }))
    }
  }
  return lines
}

/** The month table body, scrolled to `monthScroll`, clipped to the width. */
function monthBody(view: MonthView | null, options: FrameOptions): string[] {
  const color = options.color === true
  const locale = options.locale ?? 'ms'
  if (!view) {
    return ['', colorize(t(locale, options.loading ? 'state.loading' : 'state.unavailable'), { color, rgb: MUTED })]
  }

  const labelWidth = Math.max(
    ...view.columns.map((column) => visibleWidth(column.label)),
    ...view.rows.flatMap((row) => row.cells.map((cell) => visibleWidth(cell.time))),
  )
  const dateWidth = 7
  const gap = 1
  const fit = Math.max(
    1,
    Math.min(
      view.columns.length,
      Math.floor((options.columns - 2 - dateWidth - gap) / (labelWidth + gap)),
    ),
  )
  const shown = chooseMonthColumns(view.columns, fit)
  const hidden = view.columns.length - shown.length
  const kept = new Set(shown.map((column) => column.prayer))

  const lines: string[] = [
    colorize(view.title, { color, rgb: ACCENT, bold: true }) +
      (view.partial ? colorize(`  ·  ${t(locale, 'state.offline')}`, { color, rgb: MUTED }) : '') +
      (hidden > 0
        ? colorize(`  ·  ${t(locale, 'tui.hidden', { count: hidden })}`, { color, rgb: MUTED })
        : ''),
    '',
    colorize(
      pad(t(locale, 'month.date'), dateWidth) +
        ' ' +
        shown.map((column) => pad(column.label, labelWidth)).join(' '),
      { color, rgb: MUTED, bold: true },
    ),
  ]

  const scroll = Math.max(0, Math.min(options.monthScroll ?? 0, view.rows.length - 1))
  for (const row of view.rows.slice(scroll)) {
    const date = pad(`${row.day} ${row.weekday}`, dateWidth)
    const cells = row.cells
      .filter((cell) => kept.has(cell.prayer))
      .map((cell) =>
        cell.current
          ? colorize(pad(cell.time, labelWidth), { color, rgb: prayerRgb(cell.prayer), bold: true, reverse: color })
          : colorize(pad(cell.time, labelWidth), { color, rgb: prayerRgb(cell.prayer) }),
      )
      .join(' ')
    lines.push(
      (row.today ? colorize(date, { color, rgb: ACCENT, bold: true }) : date) + ' ' + cells,
    )
  }
  return lines
}

/** The trend body: one coloured sparkline per entry plus its bounds. */
/** The trend body: overlapped lines on a shared time axis. */
function trendBody(view: TrendView | null, options: FrameOptions): string[] {
  const color = options.color === true
  const locale = options.locale ?? 'ms'
  const format = options.timeFormat ?? DEFAULT_TIME_FORMAT
  if (!view) {
    return ['', colorize(t(locale, options.loading ? 'state.loading' : 'state.unavailable'), { color, rgb: MUTED })]
  }

  const axisWidth = Math.max(
    ...view.yTicks.map((tick) => visibleWidth(formatTime(tick, locale, format))),
  )
  // Room for the axis, the plot and a little breathing space on the right.
  const plotWidth = Math.max(10, options.columns - 2 - axisWidth - 2)
  // Header and footer are 8 rows; the body spends 5 on title, blanks and the
  // two axis lines, so the plot gets what is left and the legend always fits.
  const plotHeight = Math.max(3, options.rows - 13)
  const cells = plotTrend(view, plotWidth, plotHeight)

  const lines: string[] = [
    colorize(view.title, { color, rgb: ACCENT, bold: true }) +
      colorize(`  ${t(locale, 'chart.range.label')}: ${t(locale, `chart.range.${view.range}`)}`, {
        color,
        rgb: MUTED,
      }) +
      (view.stale ? colorize(`  ·  ${t(locale, 'state.offline')}`, { color, rgb: MUTED }) : ''),
    '',
  ]

  // Y axis on the left, top label first; rows map evenly onto the tick range.
  const tickAt = new Map<number, string>()
  view.yTicks.forEach((tick) => {
    const row = Math.round(
      (1 - (tick - view.min) / Math.max(1, view.max - view.min)) * (plotHeight - 1),
    )
    tickAt.set(row, formatTime(tick, locale, format))
  })

  const legend = view.series
    .map((line) => colorize(line.label, { color, rgb: prayerRgb(line.prayer) }))
    .join(' ')

  for (let row = 0; row < plotHeight; row += 1) {
    const label = pad(tickAt.get(row) ?? '', axisWidth)
    const plot = cells[row]!
    const line = plot
      .map((cell) =>
        cell.glyph === ' '
          ? ' '
          : colorize(cell.glyph, { color, rgb: prayerRgb(cell.prayer ?? 'imsak') }),
      )
      .join('')
    lines.push(`${colorize(label, { color, rgb: MUTED })}  ${line}`)
  }

  lines.push('')

  // Place each label at the column its date falls on, so the axis lines up
  // with the plot instead of just listing the ticks.
  const axisLine = new Array<string>(plotWidth).fill(' ')
  const last = Math.max(1, view.dates.length - 1)
  for (const tick of view.xTicks) {
    const column = Math.min(
      plotWidth - visibleWidth(tick.label),
      Math.round((tick.index / last) * (plotWidth - 1)),
    )
    for (let offset = 0; offset < tick.label.length; offset += 1) {
      axisLine[Math.max(0, column) + offset] = tick.label[offset]!
    }
  }
  lines.push(
    ' '.repeat(axisWidth) +
      '  ' +
      colorize(axisLine.join('').trimEnd(), { color, rgb: MUTED, dim: true }),
  )
  lines.push(' '.repeat(axisWidth) + '  ' + legend)
  return lines
}

/** Renders the day view; the shell paints these lines to the tty. */
export function renderFrame(
  view: DayView | null,
  settings: TuiSettings,
  options: FrameOptions,
): string[] {
  return compose(
    dayBody(view, { ...options, locale: settings.locale, timeFormat: settings.timeFormat }),
    settings,
    { ...options, view: 'day' },
    Math.max(20, options.columns),
  )
}

export function renderMonthFrame(
  view: MonthView | null,
  settings: TuiSettings,
  options: FrameOptions,
): string[] {
  return compose(
    monthBody(view, { ...options, locale: settings.locale, timeFormat: settings.timeFormat }),
    settings,
    { ...options, view: 'month' },
    Math.max(20, options.columns),
  )
}

export function renderTrendFrame(
  view: TrendView | null,
  settings: TuiSettings,
  options: FrameOptions,
): string[] {
  return compose(
    trendBody(view, { ...options, locale: settings.locale, timeFormat: settings.timeFormat }),
    settings,
    { ...options, view: 'trend' },
    Math.max(20, options.columns),
  )
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

/** Plain month table for piping: one line per day, entries in fixed order. */
export function plainMonthReport(view: MonthView, settings: TuiSettings, source: string): string {
  const locale = settings.locale
  const lines = [view.title, '']
  for (const row of view.rows) {
    lines.push(`${row.day} ${row.weekday}  ${row.cells.map((cell) => cell.time).join('  ')}`)
  }
  lines.push('')
  lines.push(`${t(locale, 'district.label')}: ${t(locale, `district.${settings.district}`)}`)
  lines.push(`${t(locale, 'source.label')}: ${source}`)
  return lines.join('\n')
}

/** The `wsb now` line: the current entry, or just the countdown before Imsak. */
export function nowReport(view: DayView, settings: TuiSettings): string {
  const current = view.rows.find((row) => row.prayer === view.currentPrayer)
  if (!current) return view.next
  return t(settings.locale, 'tui.now', {
    prayer: current.label,
    time: current.time,
    next: view.next,
  })
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

