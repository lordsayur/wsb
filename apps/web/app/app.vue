<template>
  <VitePwaManifest />
  <NuxtPage />
</template>

<script setup lang="ts">
// specs/web/spec.md — link previews: absolute Open Graph/Twitter metadata.
const { t, locale } = useI18n()
const origin = useRequestURL().origin
const { theme, primary } = useTheme()
const primaryFg = computed(() => readableOn(primary.value))

const title = computed(() => t('meta.title'))
const description = computed(() => t('meta.description'))

useSeoMeta({
  title,
  description,
  ogType: 'website',
  ogSiteName: computed(() => t('meta.siteName')),
  ogTitle: title,
  ogDescription: description,
  ogUrl: origin,
  ogImage: `${origin}/og-image.png`,
  ogImageAlt: computed(() => t('meta.imageAlt')),
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogLocale: computed(() => (locale.value === 'ms' ? 'ms_BN' : 'en_US')),
  ogLocaleAlternate: computed(() =>
    locale.value === 'ms' ? ['en_US'] : ['ms_BN'],
  ),
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: `${origin}/og-image.png`,
  twitterImageAlt: computed(() => t('meta.imageAlt')),
})

useHead({
  htmlAttrs: {
    lang: computed(() => locale.value),
    'data-theme': computed(() => theme.value.mode),
    style: computed(
      () =>
        `--accent:${primary.value};--primary-fg:${primaryFg.value}`,
    ),
  },
  link: [
    { rel: 'canonical', href: origin },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon-180x180.png',
    },
  ],
  meta: [
    {
      name: 'theme-color',
      content: computed(() => primary.value),
    },
  ],
})
</script>

<style>
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>
