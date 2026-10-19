// specs/web/spec.md — display settings persisted in cookies and applied during
// SSR so the first paint matches the saved choices.
import type { TimeFormat } from '@wsb/core'
import { DEFAULT_TIME_FORMAT, isTimeFormat } from '@wsb/core'

export const TIME_FORMAT_COOKIE = 'wsb.timeFormat'

const cookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax' as const,
}

export function useSettings() {
  const cookie = useCookie<string | null>(TIME_FORMAT_COOKIE, cookieOptions)
  const timeFormat = useState<TimeFormat>('wsb:timeFormat', () =>
    isTimeFormat(cookie.value) ? cookie.value : DEFAULT_TIME_FORMAT,
  )

  function setTimeFormat(next: TimeFormat) {
    if (!isTimeFormat(next)) return
    timeFormat.value = next
    cookie.value = next
  }

  return { timeFormat, setTimeFormat }
}
