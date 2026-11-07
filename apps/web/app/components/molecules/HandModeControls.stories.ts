import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import HandModeControls from './HandModeControls.vue'

// specs/web/spec.md — molecule: right/left-handed choice.
const meta: Meta<typeof HandModeControls> = {
  title: 'Molecules/HandModeControls',
  component: HandModeControls,
  args: {
    label: 'Mod tangan',
    mode: 'right',
    options: [
      { value: 'right', label: 'Kanan' },
      { value: 'left', label: 'Kiri' },
    ],
    'onUpdate:mode': fn(),
  },
}
export default meta

type Story = StoryObj<typeof HandModeControls>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Kanan' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Kiri' }),
    ).toHaveAttribute('aria-pressed', 'false')
  },
}

export const LeftHanded: Story = {
  args: { mode: 'left' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Kiri' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Switch: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Kiri' }),
    )
    await expect(args['onUpdate:mode']).toHaveBeenCalledWith('left')
  },
}
