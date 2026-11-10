import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createI18n } from 'vue-i18n'
import { defineComponent, h, inject } from 'vue'
import { Icon, addIcon } from '@iconify/vue'
import { icons as lucide } from '@iconify-json/lucide'
import ms from '../i18n/locales/ms.json'
import en from '../i18n/locales/en.json'
import ar from '../i18n/locales/ar.json'
import msArab from '../i18n/locales/ms-Arab.json'
import { ICONS } from '../app/utils/icons'
import { CLIENT_ONLY, withClientOnly } from './clientOnly'
import '../app/assets/css/theme.css'

// specs/web/spec.md — stories render through the real catalogues and the
// real icon set, without the Nuxt runtime.
for (const name of ICONS) {
  const icon = lucide.icons[name.slice(name.indexOf(':') + 1) as keyof typeof lucide.icons]
  if (icon) addIcon(name, icon)
}

/**
 * Stand-in for NuxtLink: stories have no router, so it renders a plain anchor
 * and resolves the same string / { path, query } forms the app passes.
 */
const StoryLink = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => {
      const to = props.to as
        | string
        | { path?: string; query?: Record<string, string> }
      const path = typeof to === 'string' ? to : (to.path ?? '')
      const query =
        typeof to === 'string' || !to.query
          ? ''
          : `?${new URLSearchParams(to.query).toString()}`
      return h('a', { href: `${path}${query}` }, slots.default?.())
    }
  },
})

/** Stand-in for Nuxt Icon, which takes `name`; Iconify takes `icon`. */
const StoryIcon = defineComponent({
  props: { name: { type: String, required: true }, size: String },
  setup(props, { attrs }) {
    return () => h(Icon, { ...attrs, icon: props.name, width: props.size })
  },
})

/**
 * Stand-in for Nuxt's `<ClientOnly>`. There is no server pass in a story, so by
 * default the slot stays empty and the component's CSS fallback is what shows.
 * A story that opts in with `parameters: { clientOnly: true }` gets the real
 * slot, which is how the WebGL wall is exercised.
 */
const StoryClientOnly = defineComponent({
  setup(_, { slots }) {
    const enabled = inject(CLIENT_ONLY, false)
    return () => (enabled ? slots.default?.() : null)
  },
})

/**
 * Nuxt auto-imports that components reach for directly. Stories run without the
 * Nuxt runtime, so give them the same shape with in-memory state and a cookie
 * that lives for the session. Nothing persists, which is what a story wants.
 */
const storyCookies = new Map<string, { value: unknown }>()
const storyState = new Map<string, { value: unknown }>()

;(globalThis as Record<string, unknown>).useCookie = (key: string) => {
  if (!storyCookies.has(key)) storyCookies.set(key, { value: null })
  return storyCookies.get(key)
}
;(globalThis as Record<string, unknown>).useState = (
  key: string,
  init?: () => unknown,
) => {
  if (!storyState.has(key)) {
    storyState.set(key, { value: init ? init() : undefined })
  }
  return storyState.get(key)
}

setup((app) => {
  app.component('Icon', StoryIcon)
  app.component('NuxtLink', StoryLink)
  app.component('ClientOnly', StoryClientOnly)
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
  decorators: [withClientOnly],
  parameters: {
    controls: { expanded: true },
  },
}

export default preview
