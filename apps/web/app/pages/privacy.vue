<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// specs/web/spec.md — /privacy: what analytics records, what it never records,
// and how long it is kept. Every claim here is enforced by the core and the
// analytics migration, so the page is a rendering of them, not a promise.
const { t } = useI18n()

const collected = ['collectedPage', 'collectedEvent', 'collectedDevice', 'collectedReferrer']
const notCollected = ['notIdentity', 'notCookies', 'notAddress']

useSeoMeta({
  title: () => t('privacy.title'),
  description: () => t('privacy.intro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <h1 class="title">{{ t('privacy.title') }}</h1>
      <p class="intro">{{ t('privacy.intro') }}</p>

      <section class="section">
        <h2 class="heading">{{ t('privacy.collected') }}</h2>
        <ul class="list">
          <li v-for="key in collected" :key="key">{{ t(`privacy.${key}`) }}</li>
        </ul>
      </section>

      <section class="section">
        <h2 class="heading">{{ t('privacy.notCollected') }}</h2>
        <ul class="list">
          <li v-for="key in notCollected" :key="key">{{ t(`privacy.${key}`) }}</li>
        </ul>
      </section>

      <section class="section">
        <h2 class="heading">{{ t('privacy.retention') }}</h2>
        <p>{{ t('privacy.retentionBody') }}</p>
        <p class="muted">{{ t('privacy.session') }}</p>
      </section>

      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('privacy.back') }}
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
.title {
  margin: 0;
  font-size: 1.5rem;
}
.intro {
  margin: 0;
  opacity: 0.8;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.heading {
  margin: 0;
  font-size: 1rem;
}
.list {
  margin: 0;
  padding-inline-start: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
}
.section p {
  margin: 0;
  font-size: 0.9rem;
}
.muted {
  opacity: 0.7;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
</style>
