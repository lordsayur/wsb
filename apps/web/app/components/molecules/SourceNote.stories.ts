import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import SourceNote from './SourceNote.vue'

// specs/web/spec.md — molecule: muted data-source link, prop-driven.
const meta: Meta<typeof SourceNote> = {
  title: 'Molecules/SourceNote',
  component: SourceNote,
  args: {
    label: 'Sumber data',
    name: 'Jabatan Hal Ehwal Ugama (KHEU), Brunei',
    url: 'https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx',
  },
}
export default meta

type Story = StoryObj<typeof SourceNote>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Sumber data:')).toBeVisible()
    const link = canvas.getByRole('link', { name: /KHEU/ })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', args.url)
  },
}

export const LongName: Story = {
  args: {
    name:
      'Jabatan Hal Ehwal Ugama (KHEU), Kementerian Hal Ehwal Ugama, Brunei Darussalam',
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: /Darussalam/ }),
    ).toBeVisible()
  },
}
