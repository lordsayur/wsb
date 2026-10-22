import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import { QURAN_INDEX } from '@wsb/data/quran/index'
import AyahSetup from './AyahSetup.vue'

// specs/quran/spec.md — organism: the setup state; no ayah before Start.
const meta: Meta<typeof AyahSetup> = {
  title: 'Organisms/AyahSetup',
  component: AyahSetup,
  args: {
    title: 'Ayat Al-Quran',
    intro: 'Baca satu ayat secara rawak dalam julat pilihan anda.',
    juzLabel: 'Juzuk',
    surahLabel: 'Surah',
    searchPlaceholder: 'Cari surah',
    fromLabel: 'dari',
    toLabel: 'hingga',
    startLabel: 'Mula',
    emptyLabel: 'Tiada surah sepadan.',
    emptyReason: 'Tiada ayat dalam julat ini.',
    countLabel: '6,236 daripada 6,236 ayat',
    attributionLabel: 'Teks Al-Quran oleh',
    attributionName: 'Tanzil.net',
    attributionUrl: 'https://tanzil.net/download/',
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
    onSelectSurah: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AyahSetup>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'Ayat Al-Quran' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Mula' }),
    ).toBeEnabled()
    await expect(canvas.getByText('6,236 daripada 6,236 ayat')).toBeVisible()
  },
}

export const EmptyIntersection: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Mula' })).toBeDisabled()
    await expect(canvas.getByText('Tiada ayat dalam julat ini.')).toBeVisible()
  },
}

export const StartReads: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Mula' }),
    )
    await expect(args.onStart).toHaveBeenCalledTimes(1)
  },
}
