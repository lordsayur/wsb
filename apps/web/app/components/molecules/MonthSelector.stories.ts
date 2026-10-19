import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import MonthSelector from './MonthSelector.vue'

// specs/web/spec.md — molecule: month stepper in the footer.
const meta: Meta<typeof MonthSelector> = {
  title: 'Molecules/MonthSelector',
  component: MonthSelector,
  args: {
    label: 'Bulan',
    title: 'Oktober 2026',
    current: true,
    prevLabel: 'Bulan sebelumnya',
    nextLabel: 'Bulan seterusnya',
    todayLabel: 'Bulan ini',
    onShift: fn(),
    onToday: fn(),
  },
}
export default meta

type Story = StoryObj<typeof MonthSelector>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Oktober 2026')).toBeVisible()
    await userEvent.click(canvas.getByLabelText('Bulan seterusnya'))
    await expect(args.onShift).toHaveBeenCalledWith(1)
    await userEvent.click(canvas.getByLabelText('Bulan sebelumnya'))
    await expect(args.onShift).toHaveBeenCalledWith(-1)
  },
}

export const PastMonthOffersToday: Story = {
  args: { title: 'September 2026', current: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: /September 2026.*Bulan ini/ }),
    )
    await expect(args.onToday).toHaveBeenCalled()
  },
}

export const LongMonthNameFits: Story = {
  args: { title: 'September 2026', current: false },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('September 2026'),
    ).toBeVisible()
  },
}
