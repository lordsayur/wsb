import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import PlatformCard from './PlatformCard.vue'

// specs/web/spec.md — molecule: one platform, available or coming soon.
const meta: Meta<typeof PlatformCard> = {
  title: 'Molecules/PlatformCard',
  component: PlatformCard,
  args: {
    name: 'Sambungan pelayar',
    description: 'Waktu sembahyang di bar alat dan pada setiap halaman.',
    status: 'available',
    statusLabel: 'Tersedia',
    actionLabel: 'Muat turun',
  },
}
export default meta

type Story = StoryObj<typeof PlatformCard>

export const Available: Story = {
  args: { href: 'https://github.com/lordsayur/wsb/releases/latest' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Sambungan pelayar' })).toBeVisible()
    await expect(canvas.getByText('Tersedia')).toBeVisible()
    const link = canvas.getByRole('link', { name: 'Muat turun' })
    await expect(link).toHaveAttribute('href', args.href!)
  },
}

export const ComingSoon: Story = {
  args: {
    name: 'CLI',
    description: 'Waktu sembahyang di terminal anda.',
    status: 'soon',
    statusLabel: 'Akan datang',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Akan datang')).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
    await expect(canvas.getByText('Muat turun')).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}
