import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AyahRow from './AyahRow.vue'

// specs/quran/spec.md — molecule: one ayah row. Hidden text stays out of the
// DOM; the circular play control is independent from revealing the text.
const meta: Meta<typeof AyahRow> = {
  title: 'Molecules/AyahRow',
  component: AyahRow,
  args: {
    text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    shown: false,
    status: 'idle',
    playLabel: 'Mainkan bacaan',
    pauseLabel: 'Hentikan bacaan',
    revealLabel: 'Tunjuk ayat',
    errorLabel: 'Bacaan tidak dapat dimuatkan.',
    retryLabel: 'Cuba lagi',
    label: 'Ayat',
    onToggleAudio: fn(),
    onRevealText: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AyahRow>

export const Hidden: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/بِسْمِ/)).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Mainkan bacaan' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Tunjuk ayat' }))
    await expect(args.onToggleAudio).toHaveBeenCalledTimes(1)
    await expect(args.onRevealText).toHaveBeenCalledTimes(1)
  },
}

export const Shown: Story = {
  args: { shown: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/بِسْمِ/)).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Tunjuk ayat' })).toBeNull()
  },
}

export const Loading: Story = {
  args: { status: 'loading' },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Mainkan bacaan',
    })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(button)
    await expect(args.onToggleAudio).toHaveBeenCalledTimes(1)
  },
}

export const Playing: Story = {
  args: { shown: true, status: 'playing' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Hentikan bacaan',
    })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Error: Story = {
  args: { status: 'error' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Cuba lagi' }))
    await expect(args.onToggleAudio).toHaveBeenCalledTimes(1)
  },
}
