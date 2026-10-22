import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import RangeSelector from './RangeSelector.vue'

// specs/web/spec.md — molecule: chart range switch and period stepper.
const options = [
  { value: 'week', label: 'Minggu' },
  { value: 'month', label: 'Bulan' },
  { value: 'year', label: 'Tahun' },
]

const meta: Meta<typeof RangeSelector> = {
  title: 'Molecules/RangeSelector',
  component: RangeSelector,
  args: {
    label: 'Tempoh',
    value: 'month',
    options,
    current: true,
    prevLabel: 'Tempoh sebelumnya',
    nextLabel: 'Tempoh seterusnya',
    todayLabel: 'Tempoh ini',
    'onUpdate:range': fn(),
    onShift: fn(),
    onToday: fn(),
  },
}
export default meta

type Story = StoryObj<typeof RangeSelector>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const month = canvas.getByRole('button', { name: 'Bulan' })
    await expect(month).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(canvas.getByRole('button', { name: 'Minggu' }))
    await expect(args['onUpdate:range']).toHaveBeenCalledWith('week')

    await userEvent.click(canvas.getByLabelText('Tempoh seterusnya'))
    await expect(args.onShift).toHaveBeenCalledWith(1)
  },
}



export const PastPeriodOffersToday: Story = {
  args: { current: false },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Tempoh ini' }),
    )
    await expect(args.onToday).toHaveBeenCalled()
  },
}
