// specs/web/spec.md — remember the chosen locale across visits.
import { watch } from 'vue'

export const LOCALE_COOKIE = 'wsb.locale'

export default defineNuxtPlugin({
  name: 'wsb:i18n-locale',
  dependsOn: ['i18n:plugin'],
  async setup(nuxtApp) {
    const cookie = useCookie<string | null>(LOCALE_COOKIE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    const { locale, setLocale, locales } = nuxtApp.$i18n

    const supported = locales.value.map((l) =>
      typeof l === 'string' ? l : l.code,
    ) as string[]

    if (
      cookie.value &&
      supported.includes(cookie.value) &&
      cookie.value !== locale.value
    ) {
      await setLocale(cookie.value as (typeof locale.value))
    }

    watch(locale, (next) => {
      if (supported.includes(next as string)) cookie.value = next as string
    })
  },
})
