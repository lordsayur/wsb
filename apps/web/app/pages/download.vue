<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PlatformCard from '~/components/molecules/PlatformCard.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { PLATFORMS } from '~/utils/platforms'

// specs/web/spec.md — downloads page: one card per platform shell.
const { t } = useI18n()

const platforms = computed(() =>
  PLATFORMS.map((platform) => ({
    ...platform,
    name: t(`downloads.platforms.${platform.id}.name`),
    description: t(`downloads.platforms.${platform.id}.description`),
    statusLabel:
      platform.status === 'available'
        ? t('downloads.available')
        : t('downloads.soon'),
    actionLabel:
      platform.status === 'available'
        ? t('downloads.download')
        : t('downloads.soon'),
    storeLabel: platform.storeUrl ? t('downloads.marketplace') : undefined,
  })),
)

useSeoMeta({
  title: () => t('downloads.title'),
  description: () => t('downloads.intro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <h1 class="title">{{ t('downloads.title') }}</h1>
      <p class="intro">{{ t('downloads.intro') }}</p>

      <div class="cards">
        <div v-for="platform in platforms" :key="platform.id" class="card-slot">
          <PlatformCard
            :name="platform.name"
            :description="platform.description"
            :status="platform.status"
            :status-label="platform.statusLabel"
            :action-label="platform.actionLabel"
            :href="platform.url"
            :store-href="platform.storeUrl"
            :store-label="platform.storeLabel"
          />
          <p v-if="platform.installNote" class="note">
            {{ t(`downloads.installNote.${platform.installNote}`) }}
          </p>
        </div>
      </div>

      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('downloads.back') }}
      </NuxtLink>
      <SourceNote
        :label="t('source.label')"
        :name="t('source.name')"
        :url="MORA_PAGE_URL"
      />
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
.cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.card-slot {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.note {
  margin: 0;
  font-size: 0.75rem;
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
