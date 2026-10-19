import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import UpdatePrompt from './UpdatePrompt.vue'

// specs/web/spec.md — molecule: PWA update banner; update/dismiss interactions.
const meta: Meta<typeof UpdatePrompt> = {
  title: 'Molecules/UpdatePrompt',
  component: UpdatePrompt,
  args: {
    onUpdate: fn(),
    onDismiss: fn(),
    message: 'Versi baharu tersedia. Muat semula untuk mengemas kini.',
    actionLabel: 'Muat semula',
    dismissLabel: 'Kemudian',
  },
}
export default meta

type Story = StoryObj<typeof UpdatePrompt>

export const Default: Story = {
  args: { show: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/Versi baharu/)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Muat semula' }))
    await expect(args.onUpdate).toHaveBeenCalledTimes(1)
  },
}

export const Dismiss: Story = {
  args: { show: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Kemudian' }),
    )
    await expect(args.onDismiss).toHaveBeenCalledTimes(1)
  },
}

export const Hidden: Story = {
  args: { show: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('aside')).toBeNull()
  },
}
