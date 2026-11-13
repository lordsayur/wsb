import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, waitFor, within } from '@storybook/test'
import HomeSummary from './HomeSummary.vue'

// specs/web/spec.md — organism: the dashboard slide, prop-driven. The running
// entry is the hero; the next one and how long is left sit under it. Over the
// wall the text takes the top cement band; the aurora keeps the old layout.
const meta: Meta<typeof HomeSummary> = {
  title: 'Organisms/HomeSummary',
  component: HomeSummary,
  // The card fills its deck in the app; give it the same full-height column
  // here, otherwise it collapses to its text and the wall bands have no room.
  decorators: [
    () => ({
      template:
        '<div style="block-size: 100vh; display: flex; flex-direction: column"><story /></div>',
    }),
  ],
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
    background: 'aurora',
    pages: [
      { id: 'summary', label: 'Ringkasan' },
      { id: 'today', label: 'Harian' },
      { id: 'week', label: 'Mingguan' },
    ],
    current: 'summary',
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

// The default backdrop: the wall. This story opts into the real client-only
// slot, so the Three.js scene mounts and the canvas is there. Without WebGL the
// CSS bands are the fallback; the browser test runs on WebGL, so it asserts the
// scene.
export const Wall: Story = {
  args: { background: 'wall' },
  parameters: { clientOnly: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.dashboard')).toHaveClass(
      'is-wall',
    )
    await expect(canvasElement.querySelector('.band-top')).toBeTruthy()
    await expect(canvasElement.querySelector('.band-bottom')).toBeTruthy()
    await expect(canvasElement.querySelector('.current-name')).toHaveTextContent(
      'Zuhur',
    )
    await waitFor(
      () => expect(canvasElement.querySelector('.wall canvas')).toBeTruthy(),
      { timeout: 10_000 },
    )
  },
}

// spec: the wall's light follows the reader's clock — warm sun by day, cool
// moon by night. The hour is pinned so each look is the same on every run.
export const WallMorning: Story = {
  args: { background: 'wall', hour: 9 },
  parameters: { clientOnly: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.dashboard')).toHaveClass(
      'is-wall',
    )
    await waitFor(
      () => expect(canvasElement.querySelector('.wall canvas')).toBeTruthy(),
      { timeout: 10_000 },
    )
    await expect(
      canvasElement.querySelector('.wall-scene')?.getAttribute('data-light'),
    ).toBe('sun')
    await expect(canvasElement.querySelector('.current-name')).toHaveTextContent(
      'Zuhur',
    )
  },
}

export const WallNight: Story = {
  args: {
    background: 'wall',
    hour: 21,
    weekday: 'Isnin',
    currentName: 'Isyak',
    currentTime: '19:12',
    currentLabel: 'Sedang berlangsung',
    nextLabel: 'Seterusnya',
    nextName: 'Imsak',
    nextTime: '04:39',
    countdown: '5 jam 27 minit lagi',
  },
  parameters: { clientOnly: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.dashboard')).toHaveClass(
      'is-wall',
    )
    await waitFor(
      () => expect(canvasElement.querySelector('.wall canvas')).toBeTruthy(),
      { timeout: 10_000 },
    )
    await expect(
      canvasElement.querySelector('.wall-scene')?.getAttribute('data-light'),
    ).toBe('moon')
    await expect(canvasElement.querySelector('.current-name')).toHaveTextContent(
      'Isyak',
    )
    await expect(canvasElement.querySelector('.next-name')).toHaveTextContent(
      'Imsak',
    )
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

// The card carries the deck's dots at its own top, under the basmalah.
export const WithPages: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(3)
    await expect(
      canvas.getByRole('button', { name: 'Ringkasan' }),
    ).toHaveAttribute('aria-current', 'page')
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
