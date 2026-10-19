import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import MonthPrayerTable from './MonthPrayerTable.vue'

// specs/web/spec.md — organism: monthly table, loading/ready/offline/unavailable.
const columns = [
  { prayer: 'imsak', label: 'Imsak' },
  { prayer: 'subuh', label: 'Subuh' },
  { prayer: 'syuruk', label: 'Syuruk' },
  { prayer: 'doha', label: 'Dhuha' },
  { prayer: 'zuhur', label: 'Zuhur' },
  { prayer: 'asar', label: 'Asar' },
  { prayer: 'maghrib', label: 'Maghrib' },
  { prayer: 'isyak', label: 'Isyak' },
]

const times = [
  '04:41',
  '04:50',
  '06:05',
  '06:32',
  '12:05',
  '15:20',
  '18:10',
  '19:20',
]

function row(date: string, day: string, weekday: string, today = false) {
  return {
    date,
    day,
    weekday,
    hijri: '',
    today,
    entries: columns.map((column, index) => ({
      ...column,
      time: times[index]!,
      current: today && index === 1,
    })),
  }
}

const rows = [
  row('2026-10-01', '1', 'Kha'),
  row('2026-10-02', '2', 'Jum', true),
  row('2026-10-03', '3', 'Sab'),
]

const meta: Meta<typeof MonthPrayerTable> = {
  title: 'Organisms/MonthPrayerTable',
  component: MonthPrayerTable,
  args: {
    state: 'ready',
    columns,
    rows,
    dateLabel: 'Tarikh',
    loadingText: 'Memuatkan…',
    unavailableText: 'Waktu sembahyang tidak tersedia.',
    offlineText: '',
  },
}
export default meta

type Story = StoryObj<typeof MonthPrayerTable>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('row')).toHaveLength(4)
    await expect(canvas.getByText('Dhuha')).toBeVisible()
    await expect(canvas.getByText('Tarikh')).toBeVisible()
  },
}

export const Loading: Story = {
  args: { state: 'loading', rows: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Memuatkan…')).toBeVisible()
  },
}

export const Unavailable: Story = {
  args: { state: 'unavailable', rows: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Waktu sembahyang tidak tersedia.'),
    ).toBeVisible()
  },
}

export const OfflineWithCache: Story = {
  args: { offlineText: 'Anda sedang luar talian. Memaparkan data terakhir.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/luar talian/)).toBeVisible()
    await expect(canvas.getAllByRole('row')).toHaveLength(4)
  },
}

export const TodayRowHighlighted: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tr[aria-current="date"]')
    await expect(rows).toHaveLength(1)
  },
}

export const WeekBands: Story = {
  args: {
    rows: [
      row('2026-10-04', '4', 'Ahd'),
      row('2026-10-05', '5', 'Isn'),
      row('2026-10-11', '11', 'Ahd'),
    ],
  },
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tbody tr')
    await expect(rows[0]).not.toHaveClass('band')
    await expect(rows[1]).toHaveClass('band')
    await expect(rows[2]).toHaveClass('band')
  },
}
