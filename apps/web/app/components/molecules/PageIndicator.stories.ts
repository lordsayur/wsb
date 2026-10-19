import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PageIndicator from './PageIndicator.vue'

// specs/web/spec.md — molecule: dots mark the current page; tapping selects.
const pages = [
  { id: 'day', label: 'Paparan harian' },
  { id: 'month', label: 'Paparan bulanan' },
]

const meta: Meta<typeof PageIndicator> = {
  title: 'Molecules/PageIndicator',
  component: PageIndicator,
  args: { pages, modelValue: 'day', label: 'Halaman' },
}
export default meta

type Story = StoryObj<typeof PageIndicator>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(2)
    await expect(canvas.getByRole('button', { name: 'Paparan harian' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

export const MonthCurrent: Story = {
  args: { modelValue: 'month' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Paparan bulanan' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}
