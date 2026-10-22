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

export const WithMarketplace: Story = {
  args: {
    name: 'Sambungan VS Code',
    description: 'Waktu sembahyang di bar status editor.',
    href: 'https://github.com/lordsayur/wsb/releases/latest/download/wsb-vscode.vsix',
    storeHref:
      'https://marketplace.visualstudio.com/items?itemName=lordsayur.wsb-vscode',
    storeLabel: 'Dapatkan di Marketplace',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'Muat turun' })).toHaveAttribute(
      'href',
      args.href!,
    )
    await expect(
      canvas.getByRole('link', { name: 'Dapatkan di Marketplace' }),
    ).toHaveAttribute('href', args.storeHref!)
  },
}

export const ComingSoon: Story = {
  args: {
    name: 'Raycast',
    description: 'Waktu sembahyang dari pelancar anda.',
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

export const WithTerminalCommand: Story = {
  args: {
    name: 'TUI',
    description: 'Antara muka terminal penuh untuk waktu sembahyang.',
    href: 'https://github.com/lordsayur/wsb/releases/latest',
    command:
      'curl -fsSL https://raw.githubusercontent.com/lordsayur/wsb/main/scripts/install.sh | sh',
    screenshot: '/tui-screenshot.png',
    screenshotAlt: 'Tangkapan skrin TUI',
    zoomLabel: 'Buka saiz penuh',
    closeLabel: 'Tutup',
    zoomInLabel: 'Klik untuk zum masuk',
    zoomOutLabel: 'Klik untuk zum keluar',
    commandLabel: 'Terminal',
    copyLabel: 'Salin',
    copiedLabel: 'Disalin',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Terminal')).toBeVisible()
    await expect(canvas.getByText(args.command!)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Buka saiz penuh' }),
    ).toBeVisible()
    const copy = canvas.getByRole('button', { name: 'Salin' })
    await expect(copy).toBeVisible()
    await copy.click()
    await expect(canvas.getByRole('button', { name: 'Disalin' })).toBeVisible()
  },
}
