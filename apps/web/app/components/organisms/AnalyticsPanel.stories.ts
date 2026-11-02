import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AnalyticsPanel from './AnalyticsPanel.vue'
import type { AnalyticsStats } from '~/composables/useAnalytics'

// specs/web/spec.md — organism: admin analytics panel, ready/empty/error.

const stats: AnalyticsStats = {
  totals: { views: 128, sessions: 64 },
  previous: { views: 100, sessions: 80 },
  days: [
    { day: '2026-10-20', views: 10, sessions: 8 },
    { day: '2026-10-21', views: 20, sessions: 12 },
    { day: '2026-10-22', views: 40, sessions: 20 },
    { day: '2026-10-23', views: 30, sessions: 14 },
    { day: '2026-10-24', views: 28, sessions: 10 },
  ],
  topPaths: [
    { path: '/', views: 80 },
    { path: '/prayer-times/graph', views: 30 },
    { path: '/ayat', views: 18 },
  ],
  events: [{ event: 'pageview', views: 128 }],
  locales: [
    { locale: 'ms', views: 110 },
    { locale: 'en', views: 18 },
  ],
  devices: [
    { device: 'mobile', views: 90 },
    { device: 'desktop', views: 30 },
    { device: 'tablet', views: 8 },
  ],
  referrers: [
    { referrerHost: 'google.com', views: 40 },
    { referrerHost: null, views: 88 },
  ],
}

const empty: AnalyticsStats = {
  totals: { views: 0, sessions: 0 },
  previous: { views: 0, sessions: 0 },
  days: [],
  topPaths: [],
  events: [],
  locales: [],
  devices: [],
  referrers: [],
}

const meta: Meta<typeof AnalyticsPanel> = {
  title: 'Organisms/AnalyticsPanel',
  component: AnalyticsPanel,
  args: {
    title: 'Analitik',
    state: 'ready',
    stats,
    days: 30,
    includeOther: false,
    rangeLabel: 'Tempoh',
    includeOtherLabel: 'Termasuk pratonton dan pembangunan',
    viewsLabel: 'Paparan',
    sessionsLabel: 'Sesi',
    dailyLabel: 'Paparan harian',
    topPagesLabel: 'Halaman teratas',
    eventsLabel: 'Peristiwa',
    localesLabel: 'Bahasa',
    devicesLabel: 'Peranti',
    referrersLabel: 'Rujukan',
    directLabel: 'Terus',
    loadingText: 'Memuatkan…',
    emptyText: 'Tiada lawatan direkodkan untuk tempoh ini.',
    errorText: 'Analitik tidak dapat dimuatkan.',
    eventLabels: { pageview: 'Paparan halaman' },
    deviceLabels: {
      mobile: 'Mudah alih',
      tablet: 'Tablet',
      desktop: 'Desktop',
    },
    'onUpdate:days': fn(),
    'onUpdate:includeOther': fn(),
  },
}
export default meta

type Story = StoryObj<typeof AnalyticsPanel>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('+28%')).toBeInTheDocument()
    await expect(canvas.getByText('-20%')).toBeInTheDocument()
    await expect(canvas.getAllByText('128')).toHaveLength(2)
    await expect(canvas.getByText('/prayer-times/graph')).toBeInTheDocument()
    await expect(canvas.getByText('Terus')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: '7' }))
    await expect(args['onUpdate:days']).toHaveBeenCalledWith(7)

    await userEvent.click(
      canvas.getByLabelText('Termasuk pratonton dan pembangunan'),
    )
    await expect(args['onUpdate:includeOther']).toHaveBeenCalledWith(true)
  },
}

export const Loading: Story = {
  args: { state: 'loading', stats: null },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Memuatkan…'),
    ).toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { state: 'ready', stats: empty },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Tiada lawatan direkodkan untuk tempoh ini.',
      ),
    ).toBeInTheDocument()
  },
}

export const ErrorState: Story = {
  args: { state: 'error', stats: null },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Analitik tidak dapat dimuatkan.'),
    ).toBeInTheDocument()
  },
}

export const OtherEnvironmentsIncluded: Story = {
  args: { includeOther: true },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByLabelText(
      'Termasuk pratonton dan pembangunan',
    )
    await expect(toggle).toBeChecked()
  },
}
