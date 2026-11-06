import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import VersionBadge from './VersionBadge.vue'

// specs/release/spec.md — molecule: version, marked while beta.
const meta: Meta<typeof VersionBadge> = {
  title: 'Molecules/VersionBadge',
  component: VersionBadge,
  args: { version: '4.0.0-beta.3', beta: true, betaLabel: 'beta' },
}
export default meta

type Story = StoryObj<typeof VersionBadge>

export const Beta: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4.0.0-beta.3')).toBeVisible()
    await expect(canvas.getByText('beta')).toBeVisible()
  },
}

export const Stable: Story = {
  args: { version: '4.0.0', beta: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4.0.0')).toBeVisible()
    await expect(canvas.queryByText('beta')).toBeNull()
  },
}
