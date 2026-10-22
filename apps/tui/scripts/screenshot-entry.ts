// specs/tui/spec.md — feeds the screenshot script: real frames from the real
// renderer, in colour, for a fixed sample day and month.
import type { PrayerEntry } from '@wsb/core'
import { buildMonthView } from '../src/shared/month.js'
import { renderFrame, renderMonthFrame, renderTrendFrame } from '../src/shared/render.js'
import { resolveSettings } from '../src/shared/settings.js'
import { buildTrendView } from '../src/shared/trend.js'
import { buildDayView } from '../src/shared/view.js'

const base: PrayerEntry[] = [
  { prayer: 'imsak', minutes: 4 * 60 + 41 },
  { prayer: 'subuh', minutes: 4 * 60 + 50 },
  { prayer: 'syuruk', minutes: 6 * 60 + 5 },
  { prayer: 'doha', minutes: 6 * 60 + 40 },
  { prayer: 'zuhur', minutes: 12 * 60 + 5 },
  { prayer: 'asar', minutes: 15 * 60 + 20 },
  { prayer: 'maghrib', minutes: 18 * 60 + 10 },
  { prayer: 'isyak', minutes: 19 * 60 + 20 },
]

const drift = [0, 1, 2, 2, 1, 0, -1, -1, 0, 1, 2, 3, 3, 2, 1, 0, -1, -2, -2, -1, 0, 1, 2, 2, 1, 0, -1, -1, 0, 1, 2]

const days = drift.map((offset, index) => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  entries: base.map((entry) => ({ prayer: entry.prayer, minutes: entry.minutes + offset })),
  hijriDate: '11 Jamadilawal 1448 H',
}))

const settings = resolveSettings(undefined)
const options = {
  columns: 76,
  rows: 18,
  showHelp: false,
  unavailable: false,
  loading: false,
  source: 'Jabatan Hal Ehwal Ugama (KHEU), Brunei',
  color: true,
}

const day = buildDayView(days[21]!, settings, 12 * 60 * 60 + 10 * 60)
const month = buildMonthView(days, '2026-10', {
  settings,
  today: days[21]!.date,
  nowSeconds: 12 * 60 * 60 + 10 * 60,
})
const trend = buildTrendView(days, '2026-10', settings, 30)

process.stdout.write(
  JSON.stringify({
    color: true,
    frames: [
      renderFrame(day, settings, options).join('\n'),
      renderMonthFrame(month, settings, options).join('\n'),
      renderTrendFrame(trend, settings, options).join('\n'),
    ],
  }),
)
