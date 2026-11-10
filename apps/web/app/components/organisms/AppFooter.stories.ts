import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import AppFooter from './AppFooter.vue'

// specs/web/spec.md — organism: district + menu controls.
const meta: Meta<typeof AppFooter> = {
  title: 'Organisms/AppFooter',
  component: AppFooter,
  args: {
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
    handModeLabel: 'Mod tangan',
    handMode: 'right',
    handModeOptions: [
      { value: 'right', label: 'Tangan kanan' },
      { value: 'left', label: 'Tangan kiri' },
    ],
    backgroundLabel: 'Latar belakang',
    background: 'wall',
    backgroundOptions: [
      { value: 'wall', label: 'Dinding' },
      { value: 'aurora', label: 'Aurora' },
    ],
    languages: [
      { code: 'ms', name: 'Bahasa Melayu' },
      { code: 'en', name: 'English' },
    ],
    downloadsLabel: 'Platform lain',
    prayerTimesLabel: 'Waktu sembahyang',
    notificationsLabel: 'Notifikasi',
    aboutLabel: 'Perihal',
    feedbackLabel: 'Maklum balas',
    unreadLabel: 'Ada notifikasi belum dibaca',
    hasUnread: false,
    tasbihLabel: 'Tasbih',
    ayatLabel: 'Cabaran Ayat Al-Quran',
    reloadDataLabel: 'Muat semula data',
    reloadAppLabel: 'Muat semula aplikasi',
    privacyLabel: 'Privasi',
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
    'onUpdate:handMode': fn(),
    'onUpdate:background': fn(),
    onShare: fn(),
    onDownloads: fn(),
    onPrayerTimes: fn(),
    onNotifications: fn(),
    onAbout: fn(),
    onFeedback: fn(),
    onTasbih: fn(),
    onAyat: fn(),
    onReloadData: fn(),
    onReloadApp: fn(),
    onPrivacy: fn(),
    onToggleNotifications: fn(),
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
      canvas.getByRole('menuitem', { name: 'Cabaran Ayat Al-Quran' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Waktu sembahyang' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Notifikasi' }),
    ).toBeVisible()
    await expect(canvas.getByRole('menuitem', { name: 'Perihal' })).toBeVisible()
    await expect(
      canvas.getByRole('menuitem', { name: 'Maklum balas' }),
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
    await expect(
      canvas.getByRole('menuitem', { name: 'Privasi' }),
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

// specs/web/spec.md — the summary dock offers the backdrop choice; the deck's
// other footers do not, so the control only appears when asked for.
export const SwitchBackground: Story = {
  args: { showBackground: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await expect(canvas.getByText('Latar belakang')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Aurora' }))
    await expect(args['onUpdate:background']).toHaveBeenCalledWith('aurora')
  },
}

export const BackgroundHidden: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await expect(canvas.queryByText('Latar belakang')).toBeNull()
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

export const OpenPrivacy: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Tetapan' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Privasi' }))
    await expect(args.onPrivacy).toHaveBeenCalledTimes(1)
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

export const OpenAyat: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(
      canvas.getByRole('menuitem', { name: 'Cabaran Ayat Al-Quran' }),
    )
    await expect(args.onAyat).toHaveBeenCalledTimes(1)
  },
}

export const OpenPrayerTimes: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(
      canvas.getByRole('menuitem', { name: 'Waktu sembahyang' }),
    )
    await expect(args.onPrayerTimes).toHaveBeenCalledTimes(1)
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
      canvas.getByRole('menuitem', { name: 'Waktu sembahyang' }),
    ).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('menuitem', { name: 'Notifikasi' }),
    ).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('menuitem', { name: 'Tasbih' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(
      canvas.getByRole('menuitem', { name: 'Maklum balas' }),
    ).toHaveFocus()
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

export const UnreadNotifications: Story = {
  args: { hasUnread: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    const item = canvas.getByRole('menuitem', { name: /Notifikasi/ })
    await expect(item).toBeVisible()
    await expect(item).toHaveTextContent('Ada notifikasi belum dibaca')
  },
}

export const OpenNotifications: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Notifikasi' }))
    await expect(args.onNotifications).toHaveBeenCalledTimes(1)
  },
}

export const OpenAbout: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Perihal' }))
    await expect(args.onAbout).toHaveBeenCalledTimes(1)
  },
}

export const OpenFeedback: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Menu' }))
    await userEvent.click(
      canvas.getByRole('menuitem', { name: 'Maklum balas' }),
    )
    await expect(args.onFeedback).toHaveBeenCalledTimes(1)
  },
}
