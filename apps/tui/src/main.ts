// specs/tui/spec.md — entry point and glue. Parses args, wires the repository,
// runs the full-screen loop or the plain piped report. No domain rules here.
import { DISTRICTS, bruneiNow, type District } from '@wsb/core'
import { VERSION, supabaseConfig } from './shared/config.js'
import { loadDay, repository, type LoadedDay } from './shared/day.js'
import { t, type Locale } from './shared/i18n.js'
import { jsonReport, plainReport, renderFrame } from './shared/render.js'
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

const SOURCE = 'Jabatan Hal Ehwal Ugama (KHEU), Brunei'

interface Args {
  date?: string
  json: boolean
  helpVersion: 'help' | 'version' | 'doctor' | null
}

export function parseArgs(argv: readonly string[]): Args {
  const args: Args = { json: false, helpVersion: null }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!
    if (arg === '--json') args.json = true
    else if (arg === '--help' || arg === '-h') args.helpVersion = 'help'
    else if (arg === '--version' || arg === '-v') args.helpVersion = 'version'
    else if (arg === 'doctor') args.helpVersion = 'doctor'
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
    '',
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
  const date = args.date ?? bruneiNow().date
  const day = await loadDay(repo, date)
  if (!day) {
    process.stderr.write(`${t(settings.locale, 'state.unavailable')}\n`)
    return 1
  }
  const view = buildDayView(day, settings)
  const text = args.json ? jsonReport(view, settings) : plainReport(view, settings, SOURCE)
  process.stdout.write(`${text}\n`)
  return 0
}

async function runInteractive(
  stores: Stores,
  settings: TuiSettings,
): Promise<number> {
  const terminal: Terminal = ttyTerminal()
  const repo = repository(stores)
  let showHelp = false
  let loading = true
  let day: LoadedDay | null = null
  let view: DayView | null = null
  let done = false
  let timer: ReturnType<typeof setInterval> | undefined

  const current = () => (day ? buildDayView(day, settings) : null)

  const paint = () => {
    if (loading) {
      terminal.paint(
        renderFrame(null, settings, {
          columns: terminal.columns(),
          rows: terminal.rows(),
          showHelp,
          unavailable: false,
          loading: true,
          source: SOURCE,
          color: true,
        }),
      )
      return
    }
    terminal.paint(
      renderFrame(view, settings, {
        columns: terminal.columns(),
        rows: terminal.rows(),
        showHelp,
        unavailable: view === null,
        loading: false,
        source: SOURCE,
        color: true,
      }),
    )
  }

  const load = async (force: boolean) => {
    loading = true
    paint()
    day = await loadDay(repo, undefined, force)
    view = current()
    loading = false
    paint()
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
    view = current()
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
    if (key === 'd') {
      settings = { ...settings, district: cycleDistrict(settings.district) }
      writeSettings(stores, settings)
      view = current()
      paint()
      return
    }
    if (key === 'l') {
      settings = { ...settings, locale: nextLocale(settings.locale) }
      writeSettings(stores, settings)
      view = current()
      paint()
      return
    }
    if (key === 'f') {
      settings = { ...settings, timeFormat: toggleTimeFormat(settings.timeFormat) }
      writeSettings(stores, settings)
      view = current()
      paint()
      return
    }
    if (key === 'r') {
      void load(true)
    }
  })

  void load(false)
  timer = setInterval(() => {
    view = current()
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

  if (!process.stdout.isTTY || args.json || args.date) {
    return runPlain(args, stores, settings)
  }
  return runInteractive(stores, settings)
}

