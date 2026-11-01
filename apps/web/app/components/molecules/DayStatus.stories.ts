import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import DayStatus from './DayStatus.vue'

// specs/web/spec.md — molecule: one status line under the dates.
const meta: Meta<typeof DayStatus> = {
  title: 'Molecules/DayStatus',
  component: DayStatus,
}
export default meta

type Story = StoryObj<typeof DayStatus>

export const Loading: Story = {
  args: { text: 'Memuatkan…', busy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Memuatkan…')).toBeVisible()
    await expect(canvasElement.querySelector('.spinner')).not.toBeNull()
  },
}

export const Refreshing: Story = {
  args: { text: 'Mengemas kini…', busy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Mengemas kini…')).toBeVisible()
  },
}

export const Offline: Story = {
  args: { text: 'Anda sedang luar talian. Memaparkan data terakhir.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/luar talian/)).toBeVisible()
    await expect(canvasElement.querySelector('.spinner')).toBeNull()
  },
}

export const Hidden: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent?.trim()).toBe('')
  },
}
