import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import LanguageControls from './LanguageControls.vue'

// specs/web/spec.md — molecule: language choice.
const meta: Meta<typeof LanguageControls> = {
  title: 'Molecules/LanguageControls',
  component: LanguageControls,
  args: {
    label: 'Bahasa',
    locale: 'ms',
    options: [
      { code: 'ms', name: 'Bahasa Melayu' },
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'العربية' },
    ],
    'onUpdate:locale': fn(),
  },
}
export default meta

type Story = StoryObj<typeof LanguageControls>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('radio', { name: 'Bahasa Melayu' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const Choose: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'English' }))
    await expect(args['onUpdate:locale']).toHaveBeenCalledWith('en')
  },
}

export const Single: Story = {
  args: {
    options: [{ code: 'ms', name: 'Bahasa Melayu' }],
  },
}
