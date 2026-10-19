import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import DateDisplay from './DateDisplay.vue'

// specs/web/spec.md — molecule: both calendars, display-ready text.
const meta: Meta<typeof DateDisplay> = {
  title: 'Molecules/DateDisplay',
  component: DateDisplay,
}
export default meta

type Story = StoryObj<typeof DateDisplay>

export const Default: Story = {
  args: {
    masihi: '18 Oktober 2026',
    hijri: '7 Jamadilawal 1448 H',
    isoDate: '2026-10-18',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('18 Oktober 2026')).toBeVisible()
    await expect(canvas.getByText('7 Jamadilawal 1448 H')).toBeVisible()
  },
}

export const English: Story = {
  args: {
    masihi: '18 October 2026',
    hijri: 'Jumada I 7, 1448 AH',
    isoDate: '2026-10-18',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('18 October 2026')).toBeVisible()
    await expect(canvas.getByText('Jumada I 7, 1448 AH')).toBeVisible()
  },
}
