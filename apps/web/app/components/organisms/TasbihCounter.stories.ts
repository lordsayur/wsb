import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import TasbihCounter from './TasbihCounter.vue'

// specs/web/spec.md — organism: the digital tasbih device.
const meta: Meta<typeof TasbihCounter> = {
  title: 'Organisms/TasbihCounter',
  component: TasbihCounter,
  args: {
    digits: ['0', '0', '0', '0'],
    label: 'Kiraan tasbih, 0',
    incrementLabel: 'Tambah satu',
    decrementLabel: 'Tolak satu',
    resetLabel: 'Set semula kepada sifar',
    onIncrement: fn(),
    onDecrement: fn(),
    onReset: fn(),
  },
}
export default meta

type Story = StoryObj<typeof TasbihCounter>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Tambah satu' }),
    )
    await expect(args.onIncrement).toHaveBeenCalledTimes(1)
  },
}

export const WithCount: Story = {
  args: { digits: ['0', '1', '0', '8'], label: 'Kiraan tasbih, 108' },
}

export const Decrement: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Tolak satu' }),
    )
    await expect(args.onDecrement).toHaveBeenCalledTimes(1)
  },
}

export const Reset: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Set semula kepada sifar',
      }),
    )
    await expect(args.onReset).toHaveBeenCalledTimes(1)
  },
}
