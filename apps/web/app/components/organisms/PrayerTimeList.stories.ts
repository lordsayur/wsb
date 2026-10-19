import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PrayerTimeList from './PrayerTimeList.vue'

// specs/web/spec.md — organism: loading, ready, offline, unavailable states.
const rows = [
  { prayer: 'subuh', label: 'Subuh', time: '04:50', current: false },
  { prayer: 'syuruk', label: 'Syuruk', time: '06:05' },
  { prayer: 'zuhur', label: 'Zuhur', time: '12:05' },
  { prayer: 'asar', label: 'Asar', time: '15:20' },
  { prayer: 'maghrib', label: 'Maghrib', time: '18:10' },
  { prayer: 'isyak', label: 'Isyak', time: '19:20', current: false },
]

const meta: Meta<typeof PrayerTimeList> = {
  title: 'Organisms/PrayerTimeList',
  component: PrayerTimeList,
}
export default meta

type Story = StoryObj<typeof PrayerTimeList>

export const Loading: Story = {
  args: { state: 'loading', loadingText: 'Memuatkan…' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Memuatkan…')).toBeVisible()
  },
}

export const Ready: Story = {
  args: { state: 'ready', rows },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('article')).toHaveLength(6)
    await expect(canvas.getByText('Syuruk')).toBeVisible()
  },
}

export const CurrentAndNext: Story = {
  args: {
    state: 'ready',
    rows: rows.map((row) => ({
      ...row,
      current: row.prayer === 'zuhur',
    })),
    nextText: '3 jam 15 minit lagi Asar',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvasElement.querySelectorAll('article[aria-current="true"]')
    await expect(current).toHaveLength(1)
    await expect(canvas.getByText('3 jam 15 minit lagi Asar')).toBeVisible()
  },
}

export const OfflineWithCache: Story = {
  args: {
    state: 'ready',
    rows,
    offlineText: 'Anda sedang luar talian. Memaparkan data terakhir.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/luar talian/)).toBeVisible()
    await expect(canvas.getAllByRole('article')).toHaveLength(6)
  },
}

export const Unavailable: Story = {
  args: { state: 'unavailable', unavailableText: 'Tidak tersedia.' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Tidak tersedia.'),
    ).toBeVisible()
  },
}
