import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createI18n } from 'vue-i18n'
import ms from '../i18n/locales/ms.json'
import en from '../i18n/locales/en.json'
import ar from '../i18n/locales/ar.json'
import msArab from '../i18n/locales/ms-Arab.json'
import '../app/assets/css/theme.css'

// specs/web/spec.md — every story renders through the real message catalogues.
setup((app) => {
  app.use(
    createI18n({
      legacy: false,
      locale: 'ms',
      fallbackLocale: 'en',
      messages: { ms, en, ar, 'ms-Arab': msArab },
    }),
  )
})

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
}

export default preview
