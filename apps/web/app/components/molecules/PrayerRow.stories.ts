import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PrayerRow from './PrayerRow.vue'

// specs/web/spec.md — molecule: label + time, no logic.
const meta: Meta<typeof PrayerRow> = {
  title: 'Molecules/PrayerRow',
  component: PrayerRow,
}
export default meta

type Story = StoryObj<typeof PrayerRow>

export const Default: Story = {
  args: { label: 'Subuh', time: '04:50' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Subuh')).toBeVisible()
    await expect(canvas.getByText('04:50')).toBeVisible()
  },
}

export const Current: Story = {
  args: { label: 'Zuhur', time: '12:05', current: true },
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('article')
    await expect(row).toHaveAttribute('aria-current', 'true')
    await expect(row).toHaveClass('current')
  },
}

export const WithNote: Story = {
  args: { label: 'Asar', time: '15:20', note: '3 jam 15 minit lagi' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3 jam 15 minit lagi')).toBeVisible()
    // The note is inline, beside the time rather than on its own line.
    await expect(canvasElement.querySelector('.line .note')).not.toBeNull()
  },
}

export const PassedInline: Story = {
  args: {
    label: 'Zuhur',
    time: '12:05',
    current: true,
    note: '3 minit 12 saat lalu',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('3 minit 12 saat lalu')).toBeVisible()
    await expect(canvasElement.querySelector('.line .note')).not.toBeNull()
  },
}

export const NoteSoon: Story = {
  args: {
    label: 'Zuhur',
    time: '12:05',
    current: true,
    note: '12 minit lagi',
    noteSoon: true,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.note')).toHaveClass('soon')
  },
}

export const EdgeMidnight: Story = {
  args: { label: 'Isyak', time: '00:02' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('00:02')).toBeVisible()
  },
}
