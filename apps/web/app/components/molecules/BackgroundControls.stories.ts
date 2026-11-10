import type { Meta, StoryObj } from '@storybook/vue3'
import { expect } from '@storybook/test'
import BackgroundControls from './BackgroundControls.vue'

// specs/web/spec.md — molecule: the summary backdrop choice. The wall is the
// default; the aurora is the flat look that came before it.
const meta: Meta<typeof BackgroundControls> = {
  title: 'Molecules/BackgroundControls',
  component: BackgroundControls,
  args: {
    label: 'Latar belakang',
    background: 'wall',
    options: [
      { value: 'wall', label: 'Dinding' },
      { value: 'aurora', label: 'Aurora' },
    ],
  },
}
export default meta

type Story = StoryObj<typeof BackgroundControls>

export const Wall: Story = {
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll('button')
    await expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'false')
  },
}

export const Aurora: Story = {
  args: { background: 'aurora' },
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll('button')
    await expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
    await expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
  },
}
