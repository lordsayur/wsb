import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AppFooter from './AppFooter.vue'

// specs/web/spec.md — organism: district + menu controls.
const meta: Meta<typeof AppFooter> = {
  title: 'Organisms/AppFooter',
  component: AppFooter,
  args: {
    view: 'day',
    monthLabel: 'Bulan',
    monthTitle: 'Oktober 2026',
    monthCurrent: true,
    monthPrevLabel: 'Bulan sebelumnya',
    monthNextLabel: 'Bulan seterusnya',
    monthTodayLabel: 'Bulan ini',
    districtLabel: 'Daerah',
    district: 'bruneiMuara',
    districtOptions: [
      { value: 'bruneiMuara', label: 'Brunei dan Muara' },
      { value: 'tutong', label: 'Tutong' },
      { value: 'belait', label: 'Belait' },
    ],
    menuLabel: 'Menu',
    settingsLabel: 'Tetapan',
    backLabel: 'Kembali',
    languageLabel: 'Bahasa',
    locale: 'ms',
    themeModeLabel: 'Mod warna',
    themeMode: 'dark',
    themeModes: [
      { value: 'dark', label: 'Gelap' },
      { value: 'light', label: 'Cerah' },
    ],
    themePaletteLabel: 'Warna utama',
    palette: 'yellow',
    paletteOptions: [
      { id: 'yellow', label: 'Kuning', color: '#facc15' },
      { id: 'green', label: 'Hijau', color: '#34d399' },
    ],
    customColor: '#facc15',
    customColorLabel: 'Tersuai',
    timeFormatLabel: 'Format masa',
    timeFormat: '24h',
    timeFormatOptions: [
      { value: '24h', label: '24 jam' },
      { value: '12h', label: '12 jam' },
    ],
    languages: [
      { code: 'ms', name: 'Bahasa Melayu' },
      { code: 'en', name: 'English' },
    ],
    downloadsLabel: 'Platform lain',
    trendLabel: 'Grafik trend',
    tasbihLabel: 'Tasbih',
    reloadDataLabel: 'Muat semula data',
    reloadAppLabel: 'Muat semula aplikasi',
    shareLabel: 'Kongsi waktu sembahyang',
    shareFormattedLabel: 'Teks berformat',
    shareRawLabel: 'Teks mentah',
    shareCopiedLabel: 'Disalin ke papan klip',
    notificationLabel: 'Hidupkan notifikasi',
    notificationsEnabled: false,
    notificationsSupported: true,
    'onUpdate:district': fn(),
    'onUpdate:locale': fn(),
    'onUpdate:themeMode': fn(),
    'onUpdate:palette': fn(),
    'onUpdate:customColor': fn(),
    'onUpdate:timeFormat': fn(),
    onShare: fn(),
    onDownloads: fn(),
    onTrend: fn(),
    onTasbih: fn(),
    onReloadData: fn(),
    onReloadApp: fn(),
    onToggleNotifications: fn(),
    onShiftMonth: fn(),
    onTodayMonth: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AppFooter>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('radiogroup', { name: 'Daerah' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Menu' })).toBeVisible()
  },
}

export const MenuOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await expect(
      canvas.getByRole('menuitem', { name: 'Tetapan' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Platform lain' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Tasbih' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Grafik trend' }),
    ).toBeVisible()
    await expect(
      canvas.queryByRole('menuitem', { name: 'Muat semula data' }),
    ).toBeNull()
  },
}

export const SettingsOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await expect(canvas.getByText('Bahasa')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Gelap' })).toBeVisible()
    await expect(canvas.getByText('Format masa')).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Muat semula data' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Muat semula aplikasi' }),
    ).toBeVisible()
  },
}

export const SwitchTo12Hour: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(canvas.getByRole('button', { name: '12 jam' }))
    await expect(args['onUpdate:timeFormat']).toHaveBeenCalledWith('12h')
  },
}

export const ToggleNotifications: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(
      canvas.getByRole('menuitemcheckbox', { name: 'Hidupkan notifikasi' }),
    )
    await expect(args.onToggleNotifications).toHaveBeenCalledTimes(1)
  },
}

export const ReloadData: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(
      canvas.getByRole('menuitem', { name: 'Muat semula data' }),
    )
    await expect(args.onReloadData).toHaveBeenCalledTimes(1)
  },
}

export const ReloadApp: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(
      canvas.getByRole('menuitem', { name: 'Muat semula aplikasi' }),
    )
    await expect(args.onReloadApp).toHaveBeenCalledTimes(1)
  },
}

export const ChooseLocale: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(canvas.getByRole('menuitemradio', { name: 'English' }))
    await expect(args['onUpdate:locale']).toHaveBeenCalledWith('en')
  },
}

export const Share: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: 'Kongsi waktu sembahyang',
      }),
    )
    await expect(args.onShare).toHaveBeenCalledWith('formatted')
  },
}

export const ShareCopied: Story = {
  args: { shareCopied: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('Disalin ke papan klip'),
    ).toBeVisible()
  },
}

export const SelectDistrict: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('radio', { name: 'Tutong' }),
    )
    await expect(args['onUpdate:district']).toHaveBeenCalledWith('tutong')
  },
}

export const OpenDownloads: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Platform lain' }))
    await expect(args.onDownloads).toHaveBeenCalledTimes(1)
  },
}

export const OpenTasbih: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tasbih' }))
    await expect(args.onTasbih).toHaveBeenCalledTimes(1)
  },
}

export const OpenTrend: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Grafik trend' }))
    await expect(args.onTrend).toHaveBeenCalledTimes(1)
  },
}

export const KeyboardArrowOpensMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Menu' })
    button.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('menuitem', { name: 'Tetapan' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('menuitem', { name: 'Grafik trend' }),
    ).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('menuitem', { name: 'Tasbih' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('menuitem', { name: 'Platform lain' })).toHaveFocus()
  },
}

export const KeyboardEscapeClosesAndRestoresFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Menu' })
    await userEvent.click(button)
    await expect(canvas.getByRole('menuitem', { name: 'Tetapan' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(button).toHaveFocus()
    await expect(canvas.queryByRole('menu')).toBeNull()
  },
}

export const KeyboardSettingsBackReturnsToMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('menuitem', { name: 'Tetapan' })).toHaveFocus()
  },
}
