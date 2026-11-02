import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import PageIndicator from './PageIndicator.vue'

// specs/web/spec.md — molecule: dots mark the current home slide.
const pages = [
  { id: 'summary', label: 'Ringkasan' },
  { id: 'today', label: 'Harian' },
  { id: 'week', label: 'Mingguan' },
]

const meta: Meta<typeof PageIndicator> = {
  title: 'Molecules/PageIndicator',
  component: PageIndicator,
  args: {
    pages,
    modelValue: 'today',
    label: 'Halaman utama',
    'onUpdate:modelValue': fn(),
  },
}
export default meta

type Story = StoryObj<typeof PageIndicator>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(3)
    await expect(canvas.getByRole('button', { name: 'Harian' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Mingguan' }))
    await expect(args['onUpdate:modelValue']).toHaveBeenCalledWith('week')
  },
}

export const FirstSlide: Story = {
  args: { modelValue: 'summary' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Ringkasan' }),
    ).toHaveAttribute('aria-current', 'page')
  },
}
