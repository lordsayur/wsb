import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { QURAN_INDEX } from '@wsb/data/quran/index'
import ScopePicker from './ScopePicker.vue'

// specs/quran/spec.md — molecule: one scope (all, one juz, one surah) + Start.
const meta: Meta<typeof ScopePicker> = {
  title: 'Molecules/ScopePicker',
  component: ScopePicker,
  args: {
    scopeLabel: 'Pilih skop',
    allLabel: 'Seluruh Al-Quran',
    juzLabel: 'Juzuk',
    fromLabel: 'dari',
    toLabel: 'hingga',
    surahLabel: 'Surah',
    searchPlaceholder: 'Cari surah',
    startLabel: 'Mula',
    emptyLabel: 'Tiada surah sepadan.',
    emptyReason: 'Tiada ayat dalam julat ini.',
    disabled: false,
    locale: 'ms',
    index: QURAN_INDEX,
    scope: { kind: 'all' },
    juzMaxValue: 30,
    onStart: fn(),
    onSelectScope: fn(),
  },
}
export default meta

type Story = StoryObj<typeof ScopePicker>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Mula' }))
    await expect(args.onStart).toHaveBeenCalledTimes(1)
    await expect(canvas.queryByRole('combobox')).toBeNull()
  },
}

export const JuzScope: Story = {
  args: { scope: { kind: 'juz', juzMin: 3, juzMax: 3 } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const from = canvas.getByRole('combobox', { name: 'Juzuk dari' })
    const to = canvas.getByRole('combobox', { name: 'Juzuk hingga' })
    await expect(from).toHaveValue('3')
    await expect(to).toHaveValue('3')
    await expect(canvas.queryByRole('searchbox')).toBeNull()
    await userEvent.selectOptions(to, '5')
    await expect(args.onSelectScope).toHaveBeenCalledWith({
      kind: 'juz',
      juzMin: 3,
      juzMax: 5,
    })
  },
}

export const SurahScope: Story = {
  args: { scope: { kind: 'surah', surah: 18 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('combobox')).toBeNull()
    await expect(canvas.getByText(/الكهف/)).toBeVisible()
  },
}

export const SwitchScope: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Juzuk' }))
    await expect(args.onSelectScope).toHaveBeenCalledWith({
      kind: 'juz',
      juzMin: 1,
      juzMax: 1,
    })
  },
}
