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
    const group = canvas.getByRole('radiogroup', { name: 'Daerah' })
    await expect(group).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: 'Belait' }))
    await expect(args['onUpdate:modelValue']).toHaveBeenCalledWith('belait')
  },
}

export const Keyboard: Story = {
  args: { label: 'Daerah', modelValue: 'bruneiMuara', options },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByRole('radio', { name: 'Brunei dan Muara' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('radio', { name: 'Tutong' })).toHaveFocus()
  },
}

export const Loading: Story = {
  args: { label: 'Daerah', modelValue: 'bruneiMuara', options: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('radiogroup', { name: 'Daerah' }),
    ).toBeVisible()
  },
}
