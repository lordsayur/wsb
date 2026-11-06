<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import VersionBadge from '~/components/molecules/VersionBadge.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { APP_VERSION, isBeta, stableVersion } from '~/utils/changelog'

// specs/release/spec.md — /about: what this is, which version is running, and
// where the version history and data live.
const { t } = useI18n()

const beta = isBeta()
const links = [
  { to: '/changelog', label: t('about.changelog') },
  { to: '/notifications', label: t('about.notifications') },
  { to: '/download', label: t('about.platforms') },
  { to: '/feedback', label: t('about.feedback') },
  { to: '/privacy', label: t('about.privacy') },
]

useSeoMeta({
  title: () => t('about.title'),
  description: () => t('about.intro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <header class="head">
        <h1 class="title">{{ t('about.title') }}</h1>
        <VersionBadge
          :version="APP_VERSION"
          :beta="beta"
          :beta-label="t('about.beta')"
        />
      </header>
      <p class="intro">{{ t('about.intro') }}</p>
      <p v-if="beta" class="note">
        {{ t('about.betaNote', { version: stableVersion() }) }}
      </p>

      <nav class="links" :aria-label="t('about.links')">
        <NuxtLink v-for="link in links" :key="link.to" class="link" :to="link.to">
          {{ link.label }}
          <Icon name="lucide:chevron-right" aria-hidden="true" />
        </NuxtLink>
      </nav>

      <section class="section">
        <h2 class="heading">{{ t('about.builtWith') }}</h2>
        <p class="body">{{ t('about.builtWithBody') }}</p>
      </section>

      <SourceNote
        :label="t('source.label')"
        :name="t('source.name')"
        :url="MORA_PAGE_URL"
      />

      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('about.back') }}
      </NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}
.content {
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.intro {
  margin: 0;
  opacity: 0.8;
}
.note {
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.85rem;
  opacity: 0.85;
}
.links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  font-size: 0.9rem;
  text-decoration: none;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.heading {
  margin: 0;
  font-size: 1rem;
}
.body {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
</style>
