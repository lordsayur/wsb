import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import ThemeControls from './ThemeControls.vue'

// specs/web/spec.md — molecule: mode + palette choices.
const meta: Meta<typeof ThemeControls> = {
  title: 'Molecules/ThemeControls',
  component: ThemeControls,
  args: {
    modeLabel: 'Mod warna',
    mode: 'dark',
    modes: [
      { value: 'dark', label: 'Gelap' },
      { value: 'light', label: 'Cerah' },
    ],
    paletteLabel: 'Warna utama',
    palette: 'yellow',
    paletteOptions: [
      { id: 'yellow', label: 'Kuning', color: '#facc15' },
      { id: 'green', label: 'Hijau', color: '#34d399' },
      { id: 'blue', label: 'Biru', color: '#60a5fa' },
      { id: 'rose', label: 'Ros', color: '#fb7185' },
      { id: 'violet', label: 'Ungu', color: '#a78bfa' },
    ],
    custom: '#facc15',
    customLabel: 'Tersuai',
    'onUpdate:mode': fn(),
    'onUpdate:palette': fn(),
    'onUpdate:custom': fn(),
  },
}
export default meta

type Story = StoryObj<typeof ThemeControls>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Gelap' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      canvas.getByRole('button', { name: 'Kuning' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Light: Story = {
  args: { mode: 'light' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Cerah' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const SwitchMode: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Cerah' }),
    )
    await expect(args['onUpdate:mode']).toHaveBeenCalledWith('light')
  },
}

export const PickPalette: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Hijau' }),
    )
    await expect(args['onUpdate:palette']).toHaveBeenCalledWith('green')
  },
}

export const CustomPalette: Story = {
  args: { palette: 'custom', custom: '#ff8800' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Kuning' }),
    ).toHaveAttribute('aria-pressed', 'false')
    await expect(
      within(canvasElement).getByLabelText('Tersuai'),
    ).toBeInTheDocument()
  },
}
