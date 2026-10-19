import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import TimeFormatControls from './TimeFormatControls.vue'

// specs/web/spec.md — molecule: 12/24-hour choice.
const meta: Meta<typeof TimeFormatControls> = {
  title: 'Molecules/TimeFormatControls',
  component: TimeFormatControls,
  args: {
    label: 'Format masa',
    format: '24h',
    options: [
      { value: '24h', label: '24 jam' },
      { value: '12h', label: '12 jam' },
    ],
    'onUpdate:format': fn(),
  },
}
export default meta

type Story = StoryObj<typeof TimeFormatControls>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: '24 jam' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      within(canvasElement).getByRole('button', { name: '12 jam' }),
    ).toHaveAttribute('aria-pressed', 'false')
  },
}

export const TwelveHour: Story = {
  args: { format: '12h' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: '12 jam' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Switch: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: '12 jam' }),
    )
    await expect(args['onUpdate:format']).toHaveBeenCalledWith('12h')
  },
}
