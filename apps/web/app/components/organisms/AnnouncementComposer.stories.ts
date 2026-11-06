import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AnnouncementComposer from './AnnouncementComposer.vue'

// specs/notifications/spec.md — organism: compose one announcement.
const meta: Meta<typeof AnnouncementComposer> = {
  title: 'Organisms/AnnouncementComposer',
  component: AnnouncementComposer,
  args: {
    titleLabel: 'Tajuk',
    bodyLabel: 'Kandungan',
    linkLabel: 'Pautan (pilihan)',
    expiresLabel: 'Tamat pada (pilihan)',
    publishLabel: 'Terbitkan',
    titlePlaceholder: 'Tajuk pengumuman',
    bodyPlaceholder: 'Tulis mesej di sini',
    busy: false,
    onPublish: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AnnouncementComposer>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Terbitkan' }),
    ).toBeDisabled()
  },
}

export const Publish: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Tajuk'), 'Penyelenggaraan')
    await userEvent.type(canvas.getByLabelText('Kandungan'), 'Malam ini.')
    await userEvent.type(canvas.getByLabelText('Pautan (pilihan)'), '/changelog')
    await userEvent.click(canvas.getByRole('button', { name: 'Terbitkan' }))
    await expect(args.onPublish).toHaveBeenCalledWith({
      messages: { ms: { title: 'Penyelenggaraan', body: 'Malam ini.' } },
      link: '/changelog',
      expiresAt: null,
    })
  },
}

export const RejectsBadLink: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('Tajuk'), 'Tajuk')
    await userEvent.type(canvas.getByLabelText('Kandungan'), 'Badan')
    await userEvent.type(canvas.getByLabelText('Pautan (pilihan)'), 'ftp://x')
    await userEvent.click(canvas.getByRole('button', { name: 'Terbitkan' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Invalid link')
    await expect(args.onPublish).not.toHaveBeenCalled()
  },
}

export const Busy: Story = {
  args: { busy: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Terbitkan' }),
    ).toBeDisabled()
  },
}
