import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PrayerNameLabel from './PrayerNameLabel.vue'

// specs/web/spec.md — atom: default and edge labels.
const meta: Meta<typeof PrayerNameLabel> = {
  title: 'Atoms/PrayerNameLabel',
  component: PrayerNameLabel,
}
export default meta

type Story = StoryObj<typeof PrayerNameLabel>

export const Default: Story = {
  args: { label: 'Subuh' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Subuh')).toBeVisible()
  },
}

export const LongLabel: Story = {
  args: { label: 'Waktu Sembahyang Subuh' },
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText('Waktu Sembahyang Subuh')
    await expect(label).toBeVisible()
  },
}
