import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PrayerTimeList from './PrayerTimeList.vue'

// specs/web/spec.md — organism: the ordered rows, with the countdown note on
// the current entry's row.
const rows = [
  { prayer: 'imsak', label: 'Imsak', time: '04:41', current: false },
  { prayer: 'subuh', label: 'Subuh', time: '04:50', current: false },
  { prayer: 'syuruk', label: 'Syuruk', time: '06:05' },
  { prayer: 'doha', label: 'Dhuha', time: '06:32' },
  { prayer: 'zuhur', label: 'Zuhur', time: '12:05' },
  { prayer: 'asar', label: 'Asar', time: '15:20' },
  { prayer: 'maghrib', label: 'Maghrib', time: '18:10' },
  { prayer: 'isyak', label: 'Isyak', time: '19:20', current: false },
]

const currentRows = rows.map((row) => ({
  ...row,
  current: row.prayer === 'zuhur',
}))
const note = {
  countdownKey: 'asar',
  countdown: '3 jam 15 minit lagi',
}

const meta: Meta<typeof PrayerTimeList> = {
  title: 'Organisms/PrayerTimeList',
  component: PrayerTimeList,
}
export default meta

type Story = StoryObj<typeof PrayerTimeList>

export const Loading: Story = {
  args: {
    rows: rows.map((row) => ({ ...row, time: '' })),
    pendingTime: '--:--',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('article')).toHaveLength(8)
    await expect(canvas.getAllByText('--:--')).toHaveLength(8)
  },
}

export const Ready: Story = {
  args: { rows },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('article')).toHaveLength(8)
    await expect(canvas.getByText('Imsak')).toBeVisible()
    await expect(canvas.getByText('Syuruk')).toBeVisible()
  },
}

export const CurrentWithCountdown: Story = {
  args: { rows: currentRows, ...note },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvasElement.querySelectorAll('article[aria-current="true"]')
    await expect(current).toHaveLength(1)
    await expect(canvasElement.querySelectorAll('.prayer-row')).toHaveLength(8)
    // The countdown sits on the next entry's row, not the current one.
    await expect(current[0]!.querySelector('.note')).toBeNull()
    const asarRow = [...canvasElement.querySelectorAll('.prayer-row')].find(
      (row) => row.textContent?.includes('Asar'),
    )
    await expect(asarRow?.querySelector('.note')).toHaveTextContent(
      '3 jam 15 minit lagi',
    )
    await expect(canvas.getByText('3 jam 15 minit lagi')).toBeVisible()
  },
}

export const CountdownSoon: Story = {
  args: {
    rows: currentRows,
    countdownKey: 'asar',
    countdown: '12 minit lagi',
    noteSoon: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.prayer-row .note'),
    ).toHaveClass('soon')
  },
}

const eveningRows = [
  { prayer: 'zuhur', label: 'Zuhur', time: '12:05' },
  { prayer: 'asar', label: 'Asar', time: '15:20', current: true },
  { prayer: 'maghrib', label: 'Maghrib', time: '18:10' },
  { prayer: 'isyak', label: 'Isyak', time: '19:20' },
  { prayer: 'imsak.next', label: 'Imsak', time: '04:42' },
  { prayer: 'subuh.next', label: 'Subuh', time: '04:51' },
]

export const Evening: Story = {
  args: {
    rows: eveningRows,
    countdownKey: 'maghrib',
    countdown: '3 jam 10 minit lagi',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('.prayer-row')).toHaveLength(6)
    await expect(canvas.queryByText('Syuruk')).not.toBeInTheDocument()
    await expect(canvas.getByText('3 jam 10 minit lagi')).toBeVisible()
    const maghrib = [...canvasElement.querySelectorAll('.prayer-row')].find(
      (row) => row.textContent?.includes('Maghrib'),
    )
    await expect(maghrib?.querySelector('.note')).toHaveTextContent(
      '3 jam 10 minit lagi',
    )
  },
}

const dawnRows = [
  { prayer: 'syuruk', label: 'Syuruk', time: '06:05' },
  { prayer: 'doha', label: 'Dhuha', time: '06:28' },
  { prayer: 'zuhur', label: 'Zuhur', time: '12:05' },
  { prayer: 'asar', label: 'Asar', time: '15:25' },
  { prayer: 'maghrib', label: 'Maghrib', time: '18:02' },
  { prayer: 'isyak', label: 'Isyak', time: '19:13' },
  { prayer: 'imsak', label: 'Imsak', time: '04:36', trailing: true },
  { prayer: 'subuh', label: 'Subuh', time: '04:46', trailing: true },
]

export const Dawn: Story = {
  args: {
    rows: dawnRows.map((row) => ({
      ...row,
      current: row.prayer === 'isyak',
    })),
    countdownKey: 'imsak',
    countdown: '4 jam 40 minit lagi',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('.prayer-row')).toHaveLength(8)
    await expect(canvas.getByText('4 jam 40 minit lagi')).toBeVisible()
    const rows = canvasElement.querySelectorAll('.prayer-row')
    await expect(rows[rows.length - 1]).toHaveTextContent('Subuh')
  },
}

export const JustPassed: Story = {
  args: {
    rows: currentRows,
    countdownKey: 'asar',
    countdown: '2 jam 59 minit lagi',
    passedKey: 'zuhur',
    passedNote: '3 minit 12 saat lalu',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.prayer-row')).toHaveLength(8)
    const current = canvasElement.querySelector('article[aria-current="true"]')
    await expect(current?.querySelector('.note')).toHaveTextContent(
      '3 minit 12 saat lalu',
    )
    // The passed note replaces the countdown rather than showing both.
    await expect(canvasElement.querySelectorAll('.note')).toHaveLength(1)
  },
}
