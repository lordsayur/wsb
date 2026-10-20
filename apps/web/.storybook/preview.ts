import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createI18n } from 'vue-i18n'
import { defineComponent, h } from 'vue'
import { Icon, addIcon } from '@iconify/vue'
import { icons as lucide } from '@iconify-json/lucide'
import ms from '../i18n/locales/ms.json'
import en from '../i18n/locales/en.json'
import ar from '../i18n/locales/ar.json'
import msArab from '../i18n/locales/ms-Arab.json'
import { ICONS } from '../app/utils/icons'
import '../app/assets/css/theme.css'

// specs/web/spec.md — stories render through the real catalogues and the
// real icon set, without the Nuxt runtime.
for (const name of ICONS) {
  const icon = lucide.icons[name.slice(name.indexOf(':') + 1) as keyof typeof lucide.icons]
  if (icon) addIcon(name, icon)
}

/** Stand-in for Nuxt Icon, which takes `name`; Iconify takes `icon`. */
const StoryIcon = defineComponent({
  props: { name: { type: String, required: true }, size: String },
  setup(props, { attrs }) {
    return () => h(Icon, { ...attrs, icon: props.name, width: props.size })
  },
})

setup((app) => {
  app.component('Icon', StoryIcon)
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
