import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import PrayerTrendChart from './PrayerTrendChart.vue'
import type {
  ChartPrayerOption,
  ChartSeries,
} from '~/composables/usePrayerChart'

// specs/web/spec.md — organism: trend chart, loading/ready/offline/unavailable.
const prayerOptions: ChartPrayerOption[] = [
  { prayer: 'subuh', label: 'Subuh' },
  { prayer: 'zuhur', label: 'Zuhur' },
  { prayer: 'asar', label: 'Asar' },
  { prayer: 'maghrib', label: 'Maghrib' },
  { prayer: 'isyak', label: 'Isyak' },
]

const days = [
  { date: '2026-10-01', label: '1 Okt', entries: {} },
  { date: '2026-10-02', label: '2 Okt', entries: {} },
  { date: '2026-10-03', label: '3 Okt', entries: {} },
]

const series: ChartSeries[] = [
  {
    prayer: 'subuh',
    label: 'Subuh',
    times: ['04:50', '04:51', '04:52'],
    values: [290, 291, 292],
  },
  {
    prayer: 'zuhur',
    label: 'Zuhur',
    times: ['12:05', '12:06', '12:05'],
    values: [725, 726, 725],
  },
  {
    prayer: 'asar',
    label: 'Asar',
    times: ['15:20', '15:21', '15:22'],
    values: [920, 921, 922],
  },
  {
    prayer: 'maghrib',
    label: 'Maghrib',
    times: ['18:10', '18:10', '18:09'],
    values: [1090, 1090, 1089],
  },
  {
    prayer: 'isyak',
    label: 'Isyak',
    times: ['19:20', '19:20', '19:19'],
    values: [1160, 1160, 1159],
  },
]

const meta: Meta<typeof PrayerTrendChart> = {
  title: 'Organisms/PrayerTrendChart',
  component: PrayerTrendChart,
  args: {
    state: 'ready',
    days,
    series,
    axis: { min: 240, max: 1200, step: 120 },
    yTicks: [
      { value: 240, label: '04:00' },
      { value: 480, label: '08:00' },
      { value: 720, label: '12:00' },
      { value: 960, label: '16:00' },
      { value: 1200, label: '20:00' },
    ],
    xTicks: [
      { index: 0, label: '1 Okt' },
      { index: 2, label: '3 Okt' },
    ],
    prayerOptions,
    visible: ['subuh', 'zuhur', 'asar', 'maghrib', 'isyak'],
    filterLabel: 'Tapis waktu',
    chartLabel: 'Grafik waktu sembahyang',
    dateLabel: 'Tarikh',
    loadingText: 'Memuatkan…',
    unavailableText: 'Waktu sembahyang tidak tersedia.',
    offlineText: '',
    hasOutliers: false,
    hideOutliers: false,
    outlierCount: 0,
    outlierLabel: 'Sembunyi luar skala',
    onTogglePrayer: fn(),
    onToggleOutliers: fn(),
  },
}
export default meta

type Story = StoryObj<typeof PrayerTrendChart>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img')).toBeVisible()
    await expect(canvasElement.querySelectorAll('path')).toHaveLength(5)
    await expect(canvas.getByRole('button', { name: /Subuh/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const Filtered: Story = {
  args: {
    series: [series[0]!],
    visible: ['subuh'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('path')).toHaveLength(1)
    await expect(canvasElement.querySelectorAll('.dot')).toHaveLength(3)
    await expect(canvas.getByRole('button', { name: /Zuhur/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

export const TogglesFilter: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Zuhur/ }),
    )
    await expect(args.onTogglePrayer).toHaveBeenCalledWith('zuhur')
  },
}

export const GapsBreakTheLine: Story = {
  args: {
    series: [
      { ...series[0]!, values: [290, null, 292], times: ['04:50', '—', '04:52'] },
    ],
    visible: ['subuh'],
  },
  play: async ({ canvasElement }) => {
    const path = canvasElement.querySelector('path')!.getAttribute('d')!
    await expect(path.match(/M/g)).toHaveLength(2)
    await expect(canvasElement.querySelectorAll('.dot')).toHaveLength(2)
  },
}

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Memuatkan…')).toBeVisible()
  },
}

export const Unavailable: Story = {
  args: { state: 'unavailable' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Waktu sembahyang tidak tersedia.'),
    ).toBeVisible()
  },
}

export const RefreshingWithCache: Story = {
  args: { refreshing: true, refreshingText: 'Mengemas kini…' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Mengemas kini…')).toBeVisible()
    await expect(canvas.getByRole('img')).toBeVisible()
  },
}

export const OfflineWithCache: Story = {
  args: { offlineText: 'Anda sedang luar talian. Memaparkan data terakhir.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/luar talian/)).toBeVisible()
    await expect(canvas.getByRole('img')).toBeVisible()
  },
}

export const OffersOutlierToggle: Story = {
  args: { hasOutliers: true, outlierCount: 2 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: /Sembunyi luar skala/ })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    await expect(args.onToggleOutliers).toHaveBeenCalled()
  },
}

export const OutliersHidden: Story = {
  args: { hasOutliers: true, hideOutliers: true, outlierCount: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: /Sembunyi luar skala/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

export const NoOutliersNoToggle: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('button', { name: /Sembunyi luar skala/ }),
    ).toBeNull()
  },
}

export const LegendSupportsArrowKeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByRole('button', { name: /Subuh/ })
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('button', { name: /Zuhur/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect(first).toHaveFocus()
  },
}
