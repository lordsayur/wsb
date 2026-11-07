import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, userEvent, within } from '@storybook/test'
import PageHeader from './PageHeader.vue'

// specs/web/spec.md — organism: the header every page outside the home deck
// shares. Its menu always offers the way home, so the reader is never stranded.
const meta: Meta<typeof PageHeader> = {
  title: 'Organisms/PageHeader',
  component: PageHeader,
  args: {
    title: 'Maklum balas',
    intro: 'Laporkan pepijat atau cadangkan penambahbaikan.',
  },
}
export default meta

type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'Maklum balas', level: 1 }),
    ).toBeVisible()
    await expect(canvas.getByText(/Laporkan pepijat/)).toBeVisible()
    await expect(
      canvas.getByText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'),
    ).toBeVisible()
  },
}

export const TitleOnly: Story = {
  args: { intro: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { level: 1 }),
    ).toBeVisible()
  },
}

export const MenuOpensOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Menu' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    const home = canvas.getByRole('menuitem', { name: /Utama/ })
    await expect(home).toBeVisible()
    await expect(home).toHaveAttribute('href', '/')
  },
}

export const MenuHasEveryDestination: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    const hrefs = canvas
      .getAllByRole('menuitem')
      .map((item) => item.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/prayer-times')
    expect(hrefs).toContain('/about')
    expect(hrefs).toContain('/feedback')
  },
}

export const SettingsReachableFromEveryPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    const settings = canvas.getByRole('menuitem', { name: /Tetapan/ })
    await expect(settings).toBeVisible()
    await userEvent.click(settings)
    await new Promise((r) => setTimeout(r, 0))
    // Theme, palette, time format, hand mode and language all arrive.
    await expect(canvas.getByText('Mod warna')).toBeVisible()
    await expect(canvas.getByText('Format masa')).toBeVisible()
    await expect(canvas.getByText('Mod tangan')).toBeVisible()
    await expect(canvas.getByText('Bahasa')).toBeVisible()
  },
}

export const SettingsBackReturnsToMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: /Tetapan/ }))
    await new Promise((r) => setTimeout(r, 0))
    await userEvent.click(canvas.getByRole('button', { name: /Kembali/ }))
    await expect(canvas.getByRole('menuitem', { name: /Utama/ })).toBeVisible()
  },
}

export const EscapeClosesAndRestoresFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Menu' })
    await userEvent.click(button)
    await userEvent.keyboard('{Escape}')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toHaveFocus()
  },
}
