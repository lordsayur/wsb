<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageHeader from '~/components/organisms/PageHeader.vue'

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
      <PageHeader
        :title="t('privacy.title')"
        :intro="t('privacy.intro')"
      />

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

    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 0 1rem 2rem;
  overflow-y: auto;
}
.content {
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.75rem;
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
</style>
