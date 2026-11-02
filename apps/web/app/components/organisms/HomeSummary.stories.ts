import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import HomeSummary from './HomeSummary.vue'

// specs/web/spec.md — organism: the summary slide, prop-driven.
const rows = [
  { prayer: 'imsak', label: 'Imsak', time: '04:39', current: false },
  { prayer: 'subuh', label: 'Subuh', time: '04:49', current: false },
  { prayer: 'syuruk', label: 'Syuruk', time: '05:58', current: false },
  { prayer: 'doha', label: 'Dhuha', time: '06:26', current: false },
  { prayer: 'zuhur', label: 'Zuhur', time: '12:05', current: true },
  { prayer: 'asar', label: 'Asar', time: '15:18', current: false },
  { prayer: 'maghrib', label: 'Maghrib', time: '18:12', current: false },
  { prayer: 'isyak', label: 'Isyak', time: '19:23', current: false },
]

const meta: Meta<typeof HomeSummary> = {
  title: 'Organisms/HomeSummary',
  component: HomeSummary,
  args: {
    weekday: 'Isnin',
    dates: { masihi: '2 November 2026', hijri: '22 Jamadilawal 1448' },
    status: '',
    busy: false,
    nextLabel: 'Seterusnya',
    nextName: 'Asar',
    nextTime: '15:18',
    countdown: '3 jam 13 minit lagi',
    nextSoon: false,
    progressLabel: 'Kemajuan waktu semasa',
    progressPercent: 42,
    todayLabel: "Waktu hari ini",
    rows,
    pendingTime: '--:--',
    allTimesLabel: 'Semua waktu',
    allTimesTo: '/prayer-times',
  },
}
export default meta

type Story = StoryObj<typeof HomeSummary>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Isnin')).toBeVisible()
    // Asar is both the next entry and a grid cell; the hero names it once.
    await expect(canvasElement.querySelector('.next-name')).toHaveTextContent(
      'Asar',
    )
    await expect(canvas.getByText('19:23')).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Semua waktu/ })).toHaveAttribute(
      'href',
      '/prayer-times',
    )
    await expect(canvasElement.querySelector('.cell.current')).not.toBeNull()
    await expect(
      canvas.getByRole('progressbar', { name: 'Kemajuan waktu semasa' }),
    ).toHaveAttribute('aria-valuenow', '42')
  },
}

export const NextSoon: Story = {
  args: { countdown: '10 minit lagi', nextSoon: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.next-card')).toHaveClass('soon')
  },
}

export const Loading: Story = {
  args: {
    status: 'Memuatkan…',
    busy: true,
    rows: rows.map((row) => ({ ...row, time: '', current: false })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeVisible()
    await expect(canvas.getAllByText('--:--')).toHaveLength(8)
  },
}

export const Unavailable: Story = {
  args: {
    status: 'Waktu sembahyang tidak tersedia.',
    rows: [],
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Waktu sembahyang tidak tersedia.'),
    ).toBeVisible()
  },
}

export const EdgeMidnight: Story = {
  args: {
    nextName: 'Imsak',
    nextTime: '04:39',
    countdown: '5 jam lagi',
    progressPercent: 0,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.next-name')).toHaveTextContent(
      'Imsak',
    )
  },
}
