import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import TimeText from './TimeText.vue'

// specs/web/spec.md — atom: display-ready time text.
const meta: Meta<typeof TimeText> = {
  title: 'Atoms/TimeText',
  component: TimeText,
}
export default meta

type Story = StoryObj<typeof TimeText>

export const Default: Story = {
  args: { text: '04:50', datetime: '04:50' },
  play: async ({ canvasElement }) => {
    const time = within(canvasElement).getByText('04:50')
    await expect(time).toBeVisible()
    await expect(time).toHaveAttribute('datetime', '04:50')
  },
}

export const Midnight: Story = {
  args: { text: '00:00' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('00:00')).toBeVisible()
  },
}
