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

export const EdgeMidnight: Story = {
  args: { label: 'Isyak', time: '00:02' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('00:02')).toBeVisible()
  },
}
