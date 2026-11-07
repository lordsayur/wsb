import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import BasmalahText from './BasmalahText.vue'

// specs/web/spec.md — atom: the basmalah, scripture rather than interface copy,
// so the same Arabic text renders whatever the reader's locale is.
const BASMALAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'

const meta: Meta<typeof BasmalahText> = {
  title: 'Atoms/BasmalahText',
  component: BasmalahText,
}
export default meta

type Story = StoryObj<typeof BasmalahText>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const text = within(canvasElement).getByText(BASMALAH)
    await expect(text).toBeVisible()
    await expect(text.closest('[lang="ar"]')).not.toBeNull()
    await expect(text.closest('[dir="rtl"]')).not.toBeNull()
  },
}
