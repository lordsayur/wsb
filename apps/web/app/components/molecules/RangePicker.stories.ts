import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { QURAN_INDEX } from '@wsb/data/quran/index'
import RangePicker from './RangePicker.vue'

// specs/quran/spec.md — molecule: the juz and surah ranges plus Start.
const meta: Meta<typeof RangePicker> = {
  title: 'Molecules/RangePicker',
  component: RangePicker,
  args: {
    juzLabel: 'Juzuk',
    surahLabel: 'Surah',
    searchPlaceholder: 'Cari surah',
    fromLabel: 'dari',
    toLabel: 'hingga',
    startLabel: 'Mula',
    emptyLabel: 'Tiada surah sepadan.',
    emptyReason: 'Tiada ayat dalam julat ini.',
    disabled: false,
    locale: 'ms',
    index: QURAN_INDEX,
    juzMin: 1,
    juzMax: 30,
    juzMaxValue: 30,
    surahMin: 1,
    surahMax: 114,
    suraMax: 114,
    onStart: fn(),
    'onUpdate:juzMin': fn(),
    'onUpdate:surahMax': fn(),
    onSelectSurah: fn(),
  },
}
export default meta

type Story = StoryObj<typeof RangePicker>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Mula' }))
    await expect(args.onStart).toHaveBeenCalledTimes(1)
  },
}

export const EmptyRange: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Mula' })).toBeDisabled()
    await expect(canvas.getByText('Tiada ayat dalam julat ini.')).toBeVisible()
  },
}

export const EditJuz: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Juzuk dari')
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    await userEvent.tab()
    await expect(args['onUpdate:juzMin']).toHaveBeenCalled()
  },
}

export const PickSurah: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'kahf')
    await userEvent.click(
      await canvas.findByRole('option', { name: /Al-Kahf/ }),
    )
    await expect(args.onSelectSurah).toHaveBeenCalledWith(18)
  },
}
