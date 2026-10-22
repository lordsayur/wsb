// specs/tui/spec.md — entry point and glue. Parses args, wires the repository,
// runs the full-screen loop or the plain piped report. No domain rules here.
import {
  DISTRICTS,
  bruneiNow,
  isChartRange,
  monthOf,
  shiftChartDate,
  shiftMonth,
  type ChartRange,
  type District,
  type PrayerEntry,
} from '@wsb/core'
import { VERSION, supabaseConfig } from './shared/config.js'
import { loadDay, loadMonth, repository, type LoadedDay } from './shared/day.js'
import { t, type Locale } from './shared/i18n.js'
import {
  jsonReport,
  nowReport,
  plainMonthReport,
  plainReport,
  renderFrame,
  renderMonthFrame,
  renderTrendFrame,
  type ShellView,
} from './shared/render.js'
import { buildMonthView, type MonthView } from './shared/month.js'
import { buildTrendView, trendDates, type TrendView } from './shared/trend.js'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  nextLocale,
  resolveSettings,
  toggleTimeFormat,
  type TuiSettings,
} from './shared/settings.js'
import { deviceStores, stateFile, type Stores } from './shared/state.js'
import { onResize, ttyTerminal, type Terminal } from './terminal.js'
import { buildDayView, type DayView } from './shared/view.js'
import {
  INSTALL_URL,
  latestTag,
  updateReport,
  updateStatus,
} from './shared/update.js'
import { spawnSync } from 'node:child_process'

const SOURCE = 'Jabatan Hal Ehwal Ugama (KHEU), Brunei'

interface Args {
  date?: string
  json: boolean
  now: boolean
  update: boolean
  apply: boolean
  month: boolean
  helpVersion: 'help' | 'version' | 'doctor' | null
}

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = {
    json: false,
    now: false,
    update: false,
    apply: false,
    month: false,
    helpVersion: null,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!
    if (arg === '--json') args.json = true
    else if (arg === '--help' || arg === '-h') args.helpVersion = 'help'
    else if (arg === '--version' || arg === '-v') args.helpVersion = 'version'
    else if (arg === 'doctor') args.helpVersion = 'doctor'
    else if (arg === 'now') args.now = true
    else if (arg === 'update') args.update = true
    else if (arg === '--apply') args.apply = true
    else if (arg === '--month') args.month = true
    else if (arg === '--date') args.date = argv[++index]
    else if (arg.startsWith('--date=')) args.date = arg.slice('--date='.length)
  }
  return args
}

export function cycleDistrict(current: District, step = 1): District {
  const index = DISTRICTS.indexOf(current)
  return DISTRICTS[(index + step + DISTRICTS.length) % DISTRICTS.length]!
}

function readSettings(stores: Stores): TuiSettings {
  const storage = stores.selection
  const raw = storage?.get(SETTINGS_KEY) ?? null
  let parsed: unknown = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  const selection = storage?.get('wsb.selection') ?? null
  const settings = resolveSettings(parsed, selection ?? undefined)
  return { ...DEFAULT_SETTINGS, ...settings }
}

function writeSettings(stores: Stores, settings: TuiSettings): void {
  stores.selection?.set(SETTINGS_KEY, JSON.stringify(settings))
  stores.selection?.set('wsb.selection', settings.district)
}

function usage(locale: Locale): string {
  return [
    t(locale, 'meta.title'),
    '',
    `${VERSION}`,
    '',
    'wsb [--date YYYY-MM-DD] [--json] [--help] [--version] [doctor]',
    'wsb now [--json]',
    'wsb --month [YYYY-MM]',
    'wsb update [--apply]',
    '',
    '  now           show the current entry and time to the next',
    '  --month       print the month table (optionally YYYY-MM)',
    '  update        check the latest release; --apply installs it',
    '  --date DATE   show another day (ISO)',
    '  --json        print one JSON object and exit',
    '  doctor        report configuration',
  ].join('\n')
}

async function runPlain(
  args: Args,
  stores: Stores,
  settings: TuiSettings,
): Promise<number> {
  const repo = repository(stores)
  if (args.month) {
    const month = args.date && /^\d{4}-\d{2}$/.test(args.date) ? args.date : monthOf(bruneiNow().date)
    const loaded = await loadMonth(repo, month)
    if (!loaded) {
      process.stderr.write(`${t(settings.locale, 'state.unavailable')}\n`)
      return 1
    }
    const monthView = {
      ...buildMonthView(loaded.days, loaded.month, {
        settings,
        today: bruneiNow().date,
        nowSeconds: bruneiNow().seconds,
      }),
      stale: loaded.stale,
      partial: loaded.partial,
    }
    process.stdout.write(`${plainMonthReport(monthView, settings, SOURCE)}\n`)
    return 0
  }
  const date = args.date ?? bruneiNow().date
  const day = await loadDay(repo, date)
  if (!day) {
    process.stderr.write(`${t(settings.locale, 'state.unavailable')}\n`)
    return 1
  }
  const view = buildDayView(day, settings)
  const text = args.json
    ? jsonReport(view, settings)
    : args.now
      ? nowReport(view, settings)
      : plainReport(view, settings, SOURCE)
  process.stdout.write(`${text}\n`)
  return 0
}

async function runInteractive(
  stores: Stores,
  settings: TuiSettings,
): Promise<number> {
  const terminal: Terminal = ttyTerminal()
  const repo = repository(stores)
  const today = bruneiNow().date
  let showHelp = false
  let loading = true
  let active: ShellView = 'day'
  let day: LoadedDay | null = null
  let monthData = null as Awaited<ReturnType<typeof loadMonth>> | null
  let trendData: { date: string; entries: PrayerEntry[] }[] | null = null
  let trendStale = false
  let trendLoadedFor = ''
  let monthCursor = monthOf(today)
  let monthScroll = 0
  let trendRange: ChartRange = 'month'
  let trendAnchor = today
  let view: DayView | null = null
  let monthView: MonthView | null = null
  let trendView: TrendView | null = null
  let done = false
  let timer: ReturnType<typeof setInterval> | undefined

  const rebuild = () => {
    view = day ? buildDayView(day, settings) : null
    monthView = monthData
      ? {
          ...buildMonthView(monthData.days, monthData.month, {
            settings,
            today,
            nowSeconds: bruneiNow().seconds,
          }),
          stale: monthData.stale,
          partial: monthData.partial,
        }
      : null
    trendView = trendData
      ? { ...buildTrendView(trendData, settings, trendRange, trendAnchor), stale: trendStale }
      : null
  }

  const options = () => ({
    columns: terminal.columns(),
    rows: terminal.rows(),
    showHelp,
    unavailable: false,
    loading: false,
    source: SOURCE,
    color: true,
    monthScroll,
  })

  const paint = () => {
    if (loading) {
      const frame =
        active === 'month'
          ? renderMonthFrame(null, settings, { ...options(), loading: true })
          : active === 'trend'
            ? renderTrendFrame(null, settings, { ...options(), loading: true })
            : renderFrame(null, settings, { ...options(), loading: true })
      terminal.paint(frame)
      return
    }
    if (active === 'month') {
      terminal.paint(renderMonthFrame(monthView, settings, options()))
    } else if (active === 'trend') {
      terminal.paint(renderTrendFrame(trendView, settings, options()))
    } else {
      terminal.paint(renderFrame(view, settings, { ...options(), unavailable: view === null }))
    }
  }

  const loadMonthData = async (force = false) => {
    if (force) await repo.refresh(today, 'bruneiMuara')
    monthData = await loadMonth(repo, monthCursor)
  }

  /** Reads every month the trend range touches; cached days come first. */
  const loadTrendData = async () => {
    const key = `${trendRange}:${trendAnchor}`
    if (trendLoadedFor === key) return
    const dates = trendDates(trendAnchor, trendRange)
    const months = [...new Set(dates.map(monthOf))]
    const found = new Map<string, PrayerEntry[]>()
    let stale = false
    // A year touches twelve months; read them together so the view is not
    // gated on twelve round trips.
    const loaded = await Promise.all(months.map((month) => loadMonth(repo, month)))
    for (const result of loaded) {
      if (!result) continue
      stale ||= result.stale
      for (const day of result.days) found.set(day.date, day.entries)
    }
    trendData = dates
      .filter((date) => found.has(date))
      .map((date) => ({ date, entries: found.get(date)! }))
    trendStale = stale || trendData.length < dates.length
    trendLoadedFor = key
  }

  const load = async (force: boolean) => {
    loading = true
    paint()
    if (active === 'day') {
      day = await loadDay(repo, undefined, force)
      if (!monthData) await loadMonthData(force)
    } else if (active === 'month') {
      if (force || monthData?.month !== monthCursor) await loadMonthData(force)
    } else {
      if (force) trendLoadedFor = ''
      await loadTrendData()
    }
    rebuild()
    loading = false
    paint()
  }

  const select = (next: ShellView) => {
    active = next
    monthScroll = 0
    void load(false)
  }

  const quit = () => {
    if (done) return
    done = true
    if (timer) clearInterval(timer)
    resize.stop()
    terminal.stop()
    process.exit(0)
  }

  const resize = onResize(process.stdout, () => {
    rebuild()
    paint()
  })

  terminal.onKey((key) => {
    if (key === 'q' || key === 'Q' || key === '\u0003' || key === '\u001b') {
      quit()
      return
    }
    if (key === '?') {
      showHelp = !showHelp
      paint()
      return
    }
    if (key === '1' || key === '2' || key === '3') {
      select(key === '1' ? 'day' : key === '2' ? 'month' : 'trend')
      return
    }
    if (key === 'Tab') {
      select(active === 'day' ? 'month' : active === 'month' ? 'trend' : 'day')
      return
    }
    if (key === 'd') {
      settings = { ...settings, district: cycleDistrict(settings.district) }
      writeSettings(stores, settings)
      rebuild()
      paint()
      return
    }
    if (key === 'l') {
      settings = { ...settings, locale: nextLocale(settings.locale) }
      writeSettings(stores, settings)
      rebuild()
      paint()
      return
    }
    if (key === 'f') {
      settings = { ...settings, timeFormat: toggleTimeFormat(settings.timeFormat) }
      writeSettings(stores, settings)
      rebuild()
      paint()
      return
    }
    if (key === 'r') {
      void load(true)
      return
    }
    if (active !== 'day') {
      if (key === 'j' || key === '\u001b[B') {
        monthScroll += 1
        paint()
        return
      }
      if (key === 'k' || key === '\u001b[A') {
        monthScroll = Math.max(0, monthScroll - 1)
        paint()
        return
      }
      if (key === ']' || key === 'n') {
        if (active === 'month') monthCursor = shiftMonth(monthCursor, 1)
        else trendAnchor = shiftChartDate(trendAnchor, trendRange, 1)
        void load(false)
        return
      }
      if (key === '[' || key === 'p') {
        if (active === 'month') monthCursor = shiftMonth(monthCursor, -1)
        else trendAnchor = shiftChartDate(trendAnchor, trendRange, -1)
        void load(false)
        return
      }
      if (active === 'trend' && (key === 'w' || key === 'm' || key === 'y')) {
        const next = key === 'w' ? 'week' : key === 'm' ? 'month' : 'year'
        if (isChartRange(next)) {
          trendRange = next
          trendLoadedFor = ''
          void load(false)
        }
        return
      }
      if (active === 'trend' && key === 't') {
        trendAnchor = today
        void load(false)
        return
      }
    }
  })

  void load(false)
  timer = setInterval(() => {
    rebuild()
    if (!loading) paint()
  }, 1000)
  process.on('SIGINT', quit)
  process.on('SIGTERM', quit)

  await new Promise<void>((resolve) => {
    process.on('exit', () => {
      terminal.restore()
      resolve()
    })
  })
  return 0
}

async function runUpdate(args: Args, settings: TuiSettings): Promise<number> {
  const status = updateStatus(VERSION, await latestTag())
  process.stdout.write(`${updateReport(status, settings.locale)}\n`)
  if (!args.apply || status.kind !== 'available') return 0

  const installed = spawnSync('sh', ['-c', `curl -fsSL ${INSTALL_URL} | sh`], {
    stdio: 'inherit',
  })
  if (installed.error) {
    process.stderr.write(`${installed.error.message}\n`)
    return 1
  }
  return installed.status ?? 1
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv)
  const stores = deviceStores()
  const settings = readSettings(stores)

  if (args.helpVersion === 'version') {
    process.stdout.write(`${VERSION}\n`)
    return 0
  }
  if (args.helpVersion === 'doctor') {
    const configured = supabaseConfig() !== null
    process.stdout.write(
      [
        `version: ${VERSION}`,
        `state: ${stateFile()}`,
        `supabase: ${configured ? 'configured' : 'missing'}`,
        `district: ${settings.district}`,
        `locale: ${settings.locale}`,
      ].join('\n') + '\n',
    )
    return 0
  }
  if (args.helpVersion === 'help') {
    process.stdout.write(`${usage(settings.locale)}\n`)
    return 0
  }
  if (args.update) {
    return runUpdate(args, settings)
  }

  if (args.now || args.month || !process.stdout.isTTY || args.json || args.date) {
    return runPlain(args, stores, settings)
  }
  return runInteractive(stores, settings)
}

