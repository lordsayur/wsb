import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AyahReader from './AyahReader.vue'

// specs/quran/spec.md — organism: the reading state, all state injected.
const meta: Meta<typeof AyahReader> = {
  title: 'Organisms/AyahReader',
  component: AyahReader,
  args: {
    texts: ['بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'],
    shown: [true],
    revealed: { juz: false, surah: false, ayah: false, next: 0 },
    audioIndex: null,
    audioStatus: 'idle',
    playLabel: 'Mainkan bacaan',
    pauseLabel: 'Hentikan bacaan',
    revealTextLabel: 'Tunjuk ayat',
    audioErrorLabel: 'Bacaan tidak dapat dimuatkan.',
    juzLabel: 'Juzuk 1',
    surahLabel: 'الفاتحة · Surah Al-Fatihah',
    ayahNumberLabel: 'Ayat 1',
    passageLabel: 'Bacaan',
    ayahLabel: 'Ayat',
    nextLabel: 'Ayat seterusnya',
    newAyahLabel: 'Ayat baharu',
    changeFilterLabel: 'Tukar penapis',
    endLabel: 'Ini ayat terakhir dalam julat ini.',
    unavailableLabel: 'Waktu sembahyang tidak tersedia.',
    retryLabel: 'Cuba lagi',
    loading: false,
    unavailable: false,
    atEnd: false,
    onNext: fn(),
    onNewAyah: fn(),
    onChangeFilter: fn(),
    onRetry: fn(),
    onToggleAudio: fn(),
    onRevealText: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AyahReader>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/بِسْمِ/)).toBeVisible()
    await expect(canvas.queryByText('Juzuk 1')).toBeNull()
    await expect(canvas.queryByText(/الفاتحة/)).toBeNull()
  },
}

export const TextHidden: Story = {
  args: { shown: [false] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/بِسْمِ/)).toBeNull()
    const play = canvas.getByRole('button', { name: 'Mainkan bacaan' })
    const reveal = canvas.getByRole('button', { name: 'Tunjuk ayat' })
    await userEvent.click(play)
    await userEvent.click(reveal)
    await expect(args.onToggleAudio).toHaveBeenCalledWith(0)
    await expect(args.onRevealText).toHaveBeenCalledWith(0)
  },
}

export const AudioLoading: Story = {
  args: { shown: [false], audioIndex: 0, audioStatus: 'loading' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Mainkan bacaan',
    })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const AudioPlaying: Story = {
  args: { shown: [true], audioIndex: 0, audioStatus: 'playing' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Hentikan bacaan',
    })
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  },
}

export const AudioError: Story = {
  args: { shown: [true], audioIndex: 0, audioStatus: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Bacaan tidak dapat dimuatkan.',
    )
    await expect(canvas.getByRole('button', { name: 'Cuba lagi' })).toBeVisible()
  },
}

export const Revealed: Story = {
  args: { revealed: { juz: true, surah: true, ayah: true, next: 0 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Juzuk 1')).toBeVisible()
    await expect(canvas.getByText(/الفاتحة/)).toBeVisible()
    await expect(canvas.getByText('Ayat 1')).toBeVisible()
  },
}

export const PartialReveal: Story = {
  args: { revealed: { juz: true, surah: false, ayah: false, next: 0 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Juzuk 1')).toBeVisible()
    await expect(canvas.queryByText(/الفاتحة/)).toBeNull()
  },
}

export const LongAyahScrolls: Story = {
  args: {
    shown: [true],
    texts: [
      'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ',
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pane = canvas.getByRole('group', { name: 'Bacaan' })
    await expect(pane).toHaveClass('texts')
    const overflow = await new Promise<string>((resolve) => {
      requestAnimationFrame(() => resolve(getComputedStyle(pane).overflowY))
    })
    await expect(overflow).toBe('auto')
    await expect(canvas.getByRole('button', { name: 'Ayat seterusnya' })).toBeVisible()
  },
}

export const Passage: Story = {
  args: {
    shown: [true, true, true],
    texts: [
      'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
      'الم',
      'ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ',
    ],
    revealed: { juz: false, surah: false, ayah: false, next: 2 },
    atEnd: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pane = canvas.getByRole('group', { name: 'Bacaan' })
    const rows = Array.from(pane.querySelectorAll('.ayah-row'))
    await expect(rows).toHaveLength(3)
    const divided = await new Promise<string[]>((resolve) => {
      requestAnimationFrame(() =>
        resolve(rows.map((row) => getComputedStyle(row).borderTopWidth)),
      )
    })
    await expect(divided).toEqual(['0px', '1px', '1px'])
    await expect(canvas.getByText('Ini ayat terakhir dalam julat ini.')).toBeVisible()
  },
}

export const Loading: Story = {
  args: { texts: [], shown: [], loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('alert')).toBeNull()
  },
}

export const Unavailable: Story = {
  args: { texts: [], shown: [], unavailable: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Cuba lagi' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

export const Actions: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Ayat seterusnya' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Ayat baharu' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Tukar penapis' }))
    await expect(args.onNext).toHaveBeenCalledTimes(1)
    await expect(args.onNewAyah).toHaveBeenCalledTimes(1)
    await expect(args.onChangeFilter).toHaveBeenCalledTimes(1)
  },
}
