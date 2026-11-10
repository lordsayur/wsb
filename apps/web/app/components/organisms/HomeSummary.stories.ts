import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within } from '@storybook/test'
import HomeSummary from './HomeSummary.vue'

// specs/web/spec.md — organism: the dashboard slide, prop-driven. The running
// entry is the hero; the next one and how long is left sit under it.
const meta: Meta<typeof HomeSummary> = {
  title: 'Organisms/HomeSummary',
  component: HomeSummary,
  args: {
    weekday: 'Isnin',
    dates: { masihi: '2 November 2026', hijri: '22 Jamadilawal 1448' },
    status: '',
    busy: false,
    currentName: 'Zuhur',
    currentTime: '12:05',
    currentLabel: 'Sedang berlangsung',
    nextLabel: 'Seterusnya',
    nextName: 'Asar',
    nextTime: '15:18',
    countdown: '3 jam 13 minit lagi',
    passedNote: '',
    nextSoon: false,
    pendingTime: '--:--',
  },
}
export default meta

type Story = StoryObj<typeof HomeSummary>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Isnin')).toBeVisible()
    await expect(canvasElement.querySelector('.current-name')).toHaveTextContent(
      'Zuhur',
    )
    await expect(canvasElement.querySelector('.next-name')).toHaveTextContent(
      'Asar',
    )
    await expect(canvas.getByText('3 jam 13 minit lagi')).toBeVisible()
  },
}

export const NextSoon: Story = {
  args: { countdown: '10 minit lagi', nextSoon: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.next')).toHaveClass('soon')
    await expect(canvasElement.querySelector('.current')).toHaveClass('soon')
  },
}

export const JustPassed: Story = {
  args: { passedNote: '2 minit 5 saat lalu' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvasElement.querySelector('.current-note'),
    ).toHaveTextContent('2 minit 5 saat lalu')
    await expect(canvas.queryByText('3 jam 13 minit lagi')).toBeNull()
  },
}

export const Morning: Story = {
  args: {
    weekday: 'Selasa',
    currentName: '',
    currentTime: '',
    nextName: 'Imsak',
    nextTime: '04:39',
    countdown: '5 jam lagi',
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.current')).toBeNull()
    await expect(canvasElement.querySelector('.next-name')).toHaveTextContent(
      'Imsak',
    )
  },
}

export const Fullscreen: Story = {
  args: { fullscreen: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.dashboard')).toHaveClass(
      'fullscreen',
    )
  },
}

export const Loading: Story = {
  args: {
    status: 'Memuatkan…',
    busy: true,
    currentName: '',
    currentTime: '',
    nextTime: '',
    countdown: '',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeVisible()
    await expect(canvas.getByText('--:--')).toBeVisible()
  },
}

export const Unavailable: Story = {
  args: {
    status: 'Waktu sembahyang tidak tersedia.',
    currentName: '',
    currentTime: '',
    nextTime: '',
    countdown: '',
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Waktu sembahyang tidak tersedia.'),
    ).toBeVisible()
  },
}
