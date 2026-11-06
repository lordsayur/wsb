import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import NotificationItem from './NotificationItem.vue'

// specs/notifications/spec.md — molecule: one notification row.
const meta: Meta<typeof NotificationItem> = {
  title: 'Molecules/NotificationItem',
  component: NotificationItem,
  args: {
    kind: 'announcement',
    kindLabel: 'Pengumuman',
    title: 'Penyelenggaraan bulanan',
    body: 'Data waktu sembahyang akan dikemas kini malam ini.',
    date: '2026-11-04T00:00:00.000Z',
    dateLabel: '4 November 2026',
    linkLabel: 'Baca lagi',
  },
}
export default meta

type Story = StoryObj<typeof NotificationItem>

export const Announcement: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Penyelenggaraan bulanan')).toBeVisible()
    await expect(canvas.getByText('Pengumuman')).toBeVisible()
    await expect(canvas.getByText('4 November 2026')).toBeVisible()
    await expect(canvas.queryByRole('link')).toBeNull()
  },
}

export const Version: Story = {
  args: {
    kind: 'version',
    kindLabel: 'Versi',
    title: '4.0.0-beta.3',
    body: 'Dua perubahan terkini.',
    changes: ['Halaman tetapan admin.', 'Halaman notifikasi.'],
    link: '/changelog',
    linkLabel: 'Lihat perubahan',
    unread: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: /Lihat perubahan/ })
    await expect(link).toHaveAttribute('href', '/changelog')
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
  },
}

export const EmptyBody: Story = {
  args: { body: '', changes: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Pengumuman')).toBeVisible()
  },
}
