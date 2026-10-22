import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { QURAN_INDEX } from '@wsb/data/quran/index'
import SurahSearch from './SurahSearch.vue'

// specs/quran/spec.md — molecule: Latin fuzzy search over the real surah names.
const meta: Meta<typeof SurahSearch> = {
  title: 'Molecules/SurahSearch',
  component: SurahSearch,
  args: {
    label: 'Surah',
    placeholder: 'Cari surah (contoh: baqarah)',
    emptyLabel: 'Tiada surah sepadan.',
    index: QURAN_INDEX,
    locale: 'ms',
    onSelect: fn(),
  },
}
export default meta

type Story = StoryObj<typeof SurahSearch>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'baqarah')
    const option = await canvas.findByRole('option', { name: /Al-Baqarah/ })
    await userEvent.click(option)
    await expect(args.onSelect).toHaveBeenCalledWith(2)
  },
}

export const Typo: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'kahff')
    await userEvent.click(
      await canvas.findByRole('option', { name: /Al-Kahf/ }),
    )
    await expect(args.onSelect).toHaveBeenCalledWith(18)
  },
}

export const KeyboardSelect: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox')
    await userEvent.type(input, 'ikhlas')
    await userEvent.keyboard('{Enter}')
    await expect(args.onSelect).toHaveBeenCalledWith(112)
  },
}

export const NoMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'zzzzzzzz')
    await expect(await canvas.findByText('Tiada surah sepadan.')).toBeVisible()
  },
}

export const EnglishNames: Story = {
  args: { locale: 'en' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox'), 'cow')
    await userEvent.click(
      await canvas.findByRole('option', { name: /The Cow/ }),
    )
    await expect(args.onSelect).toHaveBeenCalledWith(2)
  },
}
