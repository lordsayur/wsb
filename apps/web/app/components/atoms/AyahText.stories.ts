import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import AyahText from './AyahText.vue'

// specs/quran/spec.md — atom: Arabic ayah text only, no identity shown.
const meta: Meta<typeof AyahText> = {
  title: 'Atoms/AyahText',
  component: AyahText,
  args: {
    text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    label: 'Ayat',
  },
}
export default meta

type Story = StoryObj<typeof AyahText>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const text = canvas.getByLabelText('Ayat')
    await expect(text).toHaveAttribute('dir', 'rtl')
    await expect(text).toHaveAttribute('lang', 'ar')
  },
}

export const LongAyah: Story = {
  args: {
    text: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ',
  },
}

export const NoLabel: Story = {
  args: { label: undefined },
}
