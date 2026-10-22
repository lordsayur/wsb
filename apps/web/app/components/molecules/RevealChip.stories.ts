import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import RevealChip from './RevealChip.vue'

// specs/quran/spec.md — molecule: one reveal latch, disabled once used.
const meta: Meta<typeof RevealChip> = {
  title: 'Molecules/RevealChip',
  component: RevealChip,
  args: {
    label: 'Tunjuk juzuk',
    value: 'Juzuk 12',
    icon: 'lucide:layers',
    revealed: false,
    onReveal: fn(),
  },
}
export default meta

type Story = StoryObj<typeof RevealChip>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /Tunjuk juzuk/ })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    await expect(args.onReveal).toHaveBeenCalledTimes(1)
  },
}

export const Revealed: Story = {
  args: { revealed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /Juzuk 12/ })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: /Tunjuk juzuk/ }),
    ).toBeDisabled()
  },
}
