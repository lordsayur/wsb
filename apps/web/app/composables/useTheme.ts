// specs/web/spec.md — theme selection state, persisted in cookies and applied
// during SSR so the first paint already has the right colours.
import { computed } from 'vue'
import {
  DEFAULT_CUSTOM,
  DEFAULT_MODE,
  DEFAULT_PALETTE,
  isPaletteId,
  isThemeMode,
  normalizeHex,
  resolvePrimary,
  type PaletteId,
  type ThemeMode,
} from '~/utils/theme'

export interface ThemeState {
  mode: ThemeMode
  palette: PaletteId
  custom: string
}

export const THEME_COOKIE = 'wsb.theme'
export const PALETTE_COOKIE = 'wsb.palette'
export const CUSTOM_COOKIE = 'wsb.palette.custom'

const cookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax' as const,
}

export function useTheme() {
  const modeCookie = useCookie<string | null>(THEME_COOKIE, cookieOptions)
  const paletteCookie = useCookie<string | null>(PALETTE_COOKIE, cookieOptions)
  const customCookie = useCookie<string | null>(CUSTOM_COOKIE, cookieOptions)

  const theme = useState<ThemeState>('wsb:theme', () => ({
    mode: isThemeMode(modeCookie.value) ? modeCookie.value : DEFAULT_MODE,
    palette: isPaletteId(paletteCookie.value)
      ? paletteCookie.value
      : DEFAULT_PALETTE,
    custom: normalizeHex(customCookie.value) ?? DEFAULT_CUSTOM,
  }))

  const primary = computed(() =>
    resolvePrimary(theme.value.palette, theme.value.custom),
  )

  function persist() {
    modeCookie.value = theme.value.mode
    paletteCookie.value = theme.value.palette
    customCookie.value = theme.value.custom
  }

  function setMode(mode: ThemeMode) {
    theme.value = { ...theme.value, mode }
    persist()
  }

  function setPalette(palette: PaletteId) {
    theme.value = { ...theme.value, palette }
    persist()
  }

  function setCustom(custom: string) {
    const color = normalizeHex(custom)
    if (!color) return
    theme.value = { ...theme.value, custom: color, palette: 'custom' }
    persist()
  }

  return { theme, primary, setMode, setPalette, setCustom }
}
