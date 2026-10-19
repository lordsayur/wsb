import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import ShareButton from './ShareButton.vue'

// specs/web/spec.md — molecule: tap shares formatted, hold offers raw.
const meta: Meta<typeof ShareButton> = {
  title: 'Molecules/ShareButton',
  component: ShareButton,
  args: {
    label: 'Kongsi waktu sembahyang',
    formattedLabel: 'Teks berformat',
    rawLabel: 'Teks mentah',
    copiedLabel: 'Disalin ke papan klip',
    holdMs: 50,
    'onShare': fn(),
  },
}
export default meta

type Story = StoryObj<typeof ShareButton>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Kongsi waktu sembahyang',
      }),
    )
    await expect(args.onShare).toHaveBeenCalledWith('formatted')
  },
}

export const LongPressMenu: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', {
      name: 'Kongsi waktu sembahyang',
    })
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 120))
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))

    await expect(
      canvas.getByRole('menuitem', { name: 'Teks berformat' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Teks mentah' }))
    await expect(args.onShare).toHaveBeenCalledWith('raw')
  },
}

export const Copied: Story = {
  args: { copied: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Disalin ke papan klip'),
    ).toBeVisible()
  },
}
