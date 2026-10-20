import type { Meta, StoryObj } from '@storybook/vue3'
import { expect } from '@storybook/test'
import TasbihDisplay from './TasbihDisplay.vue'

// specs/web/spec.md — molecule: seven-segment LCD readout.
const meta: Meta<typeof TasbihDisplay> = {
  title: 'Molecules/TasbihDisplay',
  component: TasbihDisplay,
}
export default meta

type Story = StoryObj<typeof TasbihDisplay>

export const Zero: Story = {
  args: { digits: ['0', '0', '0', '0'] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.segment.lit')).toHaveLength(24)
  },
}

export const AllEights: Story = {
  args: { digits: ['8', '8', '8', '8'] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.segment.lit')).toHaveLength(28)
  },
}
