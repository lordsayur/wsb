import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import WeekPrayerTable from './WeekPrayerTable.vue'

// specs/web/spec.md — organism: one week transposed, prayers down and days
// across, prop-driven.
const columns = [
  { date: '2026-11-02', day: '2', weekday: 'Isn', today: true },
  { date: '2026-11-03', day: '3', weekday: 'Sel', today: false },
  { date: '2026-11-04', day: '4', weekday: 'Rab', today: false },
  { date: '2026-11-05', day: '5', weekday: 'Kha', today: false },
  { date: '2026-11-06', day: '6', weekday: 'Jum', today: false },
  { date: '2026-11-07', day: '7', weekday: 'Sab', today: false },
  { date: '2026-11-08', day: '8', weekday: 'Ahd', today: false },
]

const times = [
  ['04:39', '04:39', '04:40', '04:40', '04:40', '04:41', '04:41'],
  ['04:49', '04:49', '04:50', '04:50', '04:50', '04:51', '04:51'],
  ['05:58', '05:58', '05:58', '05:59', '05:59', '05:59', '05:59'],
  ['06:26', '06:26', '06:26', '06:27', '06:27', '06:27', '06:27'],
  ['12:05', '12:05', '12:05', '12:05', '12:05', '12:05', '12:05'],
  ['15:18', '15:18', '15:18', '15:18', '15:18', '15:18', '15:18'],
  ['18:12', '18:12', '18:12', '18:12', '18:11', '18:11', '18:11'],
  ['19:23', '19:23', '19:23', '19:23', '19:22', '19:22', '19:22'],
]

const names = [
  ['imsak', 'Imsak'],
  ['subuh', 'Subuh'],
  ['syuruk', 'Syuruk'],
  ['doha', 'Dhuha'],
  ['zuhur', 'Zuhur'],
  ['asar', 'Asar'],
  ['maghrib', 'Maghrib'],
  ['isyak', 'Isyak'],
]

const rows = names.map(([prayer, label], index) => ({
  prayer: prayer!,
  label: label!,
  cells: (times[index] ?? []).map((text, day) => ({
    text,
    current: day === 0 && prayer === 'zuhur',
  })),
}))

const meta: Meta<typeof WeekPrayerTable> = {
  title: 'Organisms/WeekPrayerTable',
  component: WeekPrayerTable,
  args: {
    state: 'ready',
    columns,
    rows,
    entryLabel: 'Waktu',
    tableLabel: 'Jadual waktu sembahyang mingguan bagi 2 – 8 Nov',
    loadingText: 'Memuatkan…',
    unavailableText: 'Waktu sembahyang tidak tersedia.',
    offlineText: '',
    refreshing: false,
    refreshingText: 'Mengemas kini…',
  },
}
export default meta

type Story = StoryObj<typeof WeekPrayerTable>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('region', {
        name: 'Jadual waktu sembahyang mingguan bagi 2 – 8 Nov',
      }),
    ).toBeVisible()
    // Prayers are the rows, days the columns, so a week reads at once.
    await expect(canvas.getAllByRole('row')).toHaveLength(9)
    await expect(canvas.getByText('Syuruk')).toBeVisible()
    await expect(canvasElement.querySelector('.day-col.today')).not.toBeNull()
    await expect(canvasElement.querySelector('td.current')).not.toBeNull()
  },
}

export const Loading: Story = {
  args: { state: 'loading', rows: [], columns: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Memuatkan…')).toBeVisible()
  },
}

export const Offline: Story = {
  args: { offlineText: 'Anda sedang luar talian. Memaparkan data terakhir.' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Anda sedang luar talian. Memaparkan data terakhir.',
      ),
    ).toBeVisible()
  },
}

export const Unavailable: Story = {
  args: { state: 'unavailable', rows: [], columns: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Waktu sembahyang tidak tersedia.'),
    ).toBeVisible()
  },
}

export const PartialWeek: Story = {
  args: {
    refreshing: true,
    rows: rows.map((row, index) => ({
      ...row,
      cells: row.cells.map((cell, day) => ({
        ...cell,
        text: index > 5 && day > 4 ? '—' : cell.text,
      })),
    })),
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Mengemas kini…'),
    ).toBeVisible()
    await expect(within(canvasElement).getAllByText('—').length).toBeGreaterThan(0)
  },
}
