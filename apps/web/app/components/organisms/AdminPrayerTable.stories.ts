import type { Meta, StoryObj } from '@storybook/vue3'
import { fireEvent, expect, fn, within } from '@storybook/test'
import type { AdminDay, StoredPrayer } from '@wsb/data/admin'
import AdminPrayerTable from './AdminPrayerTable.vue'

// specs/web/spec.md — organism: one admin row per day, eight editable cells.
const prayers = [
  'imsak',
  'subuh',
  'syuruk',
  'doha',
  'zuhur',
  'asar',
  'maghrib',
  'isyak',
] as const satisfies readonly StoredPrayer[]

const prayerLabels = {
  imsak: 'Imsak',
  subuh: 'Subuh',
  syuruk: 'Syuruk',
  doha: 'Dhuha',
  zuhur: 'Zuhur',
  asar: 'Asar',
  maghrib: 'Maghrib',
  isyak: 'Isyak',
} satisfies Record<StoredPrayer, string>

const times = [
  '04:51:00',
  '05:01:00',
  '06:16:00',
  '06:43:00',
  '12:16:00',
  '15:31:00',
  '18:21:00',
  '19:31:00',
]

function day(prayerDate: string, hijriDate: string): AdminDay {
  return {
    prayerDate,
    hijriDate,
    times: Object.fromEntries(
      prayers.map((prayer, index) => [prayer, times[index]!]),
    ) as Record<StoredPrayer, string | null>,
  }
}

const days = [
  day('2026-10-18', '7 Jamadilawal 1448 H'),
  day('2026-10-19', '8 Jamadilawal 1448 H'),
]

const meta: Meta<typeof AdminPrayerTable> = {
  title: 'Organisms/AdminPrayerTable',
  component: AdminPrayerTable,
  args: {
    days,
    busy: false,
    edits: {},
    dateLabel: 'Tarikh',
    hijriLabel: 'Hijrah',
    emptyText: 'Tiada rekod untuk bulan ini.',
    prayers,
    prayerLabels,
    onEdit: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AdminPrayerTable>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('row')).toHaveLength(3)
    await expect(canvas.getByText('2026-10-18')).toBeVisible()
    await expect(canvas.getByText('7 Jamadilawal 1448 H')).toBeVisible()
    await expect(
      canvas.getByLabelText('2026-10-18 Asar'),
    ).toHaveValue('15:31')
  },
}

export const Empty: Story = {
  args: { days: [] },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Tiada rekod untuk bulan ini.'),
    ).toBeVisible()
    await expect(within(canvasElement).queryByRole('table')).toBeNull()
  },
}

export const Busy: Story = {
  args: { busy: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByLabelText('2026-10-18 Imsak'),
    ).toBeDisabled()
  },
}

export const EditEmitsChange: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await fireEvent.change(canvas.getByLabelText('2026-10-19 Zuhur'), {
      target: { value: '12:20' },
    })
    await expect(args.onEdit).toHaveBeenCalledWith({
      prayerDate: '2026-10-19',
      prayer: 'zuhur',
      time: '12:20:00',
    })
  },
}

export const StagedEditHighlighted: Story = {
  args: {
    days: [{ ...days[0]!, times: { ...days[0]!.times, asar: '15:35:00' } }, days[1]!],
    edits: { '2026-10-18:asar': '15:35:00' },
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('2026-10-18 Asar')
    await expect(input).toHaveValue('15:35')
    await expect(input).toHaveClass('dirty')
  },
}
