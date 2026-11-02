import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, userEvent, within } from '@storybook/test'
import PageTabs from './PageTabs.vue'

// specs/web/spec.md — molecule: header nav between the prayer-times pages.
const tabs = [
  { id: 'table', label: 'Jadual' },
  { id: 'graph', label: 'Grafik' },
]

const meta: Meta<typeof PageTabs> = {
  title: 'Molecules/PageTabs',
  component: PageTabs,
  args: { tabs, modelValue: 'table', label: 'Paparan waktu sembahyang' },
}
export default meta

type Story = StoryObj<typeof PageTabs>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', {
      name: 'Paparan waktu sembahyang',
    })
    await expect(nav).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Jadual' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}

export const GraphCurrent: Story = {
  args: { modelValue: 'graph' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Grafik' }),
    ).toHaveAttribute('aria-current', 'page')
  },
}

export const KeyboardArrowsMoveAndSelect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const table = canvas.getByRole('button', { name: 'Jadual' })
    table.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('button', { name: 'Grafik' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(table).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('button', { name: 'Grafik' })).toHaveFocus()
  },
}
