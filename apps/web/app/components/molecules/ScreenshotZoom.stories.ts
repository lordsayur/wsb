import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, userEvent, within } from '@storybook/test'
import ScreenshotZoom from './ScreenshotZoom.vue'

// specs/web/spec.md — molecule: a screenshot that opens full size on click.
const meta: Meta<typeof ScreenshotZoom> = {
  title: 'Molecules/ScreenshotZoom',
  component: ScreenshotZoom,
  args: {
    src: '/tui-screenshot.png',
    alt: 'Tangkapan skrin TUI: paparan hari, bulan dan trend',
    zoomLabel: 'Buka saiz penuh',
    closeLabel: 'Tutup',
    zoomInLabel: 'Klik untuk zum masuk',
    zoomOutLabel: 'Klik untuk zum keluar',
  },
}
export default meta

type Story = StoryObj<typeof ScreenshotZoom>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Buka saiz penuh' })
    await expect(trigger).toBeVisible()
    await expect(within(trigger).getByRole('img')).toHaveAttribute(
      'src',
      '/tui-screenshot.png',
    )
    await expect(canvasElement.querySelector('dialog')?.open).toBe(false)
  },
}

export const Zoomed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Buka saiz penuh' }))
    const dialog = canvasElement.querySelector('dialog')!
    await expect(dialog.open).toBe(true)
    await expect(within(dialog).getByRole('img')).toHaveAttribute(
      'src',
      '/tui-screenshot.png',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tutup' }))
    await expect(dialog.open).toBe(false)
  },
}

export const ClickZooms: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Buka saiz penuh' }))
    const dialog = canvasElement.querySelector('dialog')!
    const scroller = dialog.querySelector<HTMLElement>('.scroller')!
    await expect(scroller.classList.contains('zoomed')).toBe(false)
    await userEvent.click(scroller)
    await expect(scroller.classList.contains('zoomed')).toBe(true)
    await expect(
      within(dialog).getByText('Klik untuk zum keluar'),
    ).toBeVisible()
    await userEvent.click(scroller)
    await expect(scroller.classList.contains('zoomed')).toBe(false)
  },
}

export const EscCloses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Buka saiz penuh' }))
    const dialog = canvasElement.querySelector('dialog')!
    await expect(dialog.open).toBe(true)
    // The browser fires `cancel` for Esc; the story cannot send a trusted key.
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
    await expect(dialog.open).toBe(false)
  },
}

export const BackdropCloses: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Buka saiz penuh' }))
    const dialog = canvasElement.querySelector('dialog')!
    await expect(dialog.open).toBe(true)
    await userEvent.click(dialog)
    await expect(dialog.open).toBe(false)
  },
}
