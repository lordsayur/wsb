import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import DistrictSelector from './DistrictSelector.vue'

// specs/web/spec.md — molecule: emits a District selection, no offset logic.
const options = [
  { value: 'bruneiMuara', label: 'Brunei dan Muara' },
  { value: 'tutong', label: 'Tutong' },
  { value: 'belait', label: 'Belait' },
]

const meta: Meta<typeof DistrictSelector> = {
  title: 'Molecules/DistrictSelector',
  component: DistrictSelector,
  args: { 'onUpdate:modelValue': fn() },
}
export default meta

type Story = StoryObj<typeof DistrictSelector>

export const Default: Story = {
  args: { label: 'Daerah', modelValue: 'bruneiMuara', options },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const select = canvas.getByLabelText('Daerah')
    await userEvent.selectOptions(select, 'belait')
    await expect(args['onUpdate:modelValue']).toHaveBeenCalledWith('belait')
  },
}

export const Loading: Story = {
  args: { label: 'Daerah', modelValue: 'bruneiMuara', options: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByLabelText('Daerah'),
    ).toBeVisible()
  },
}
