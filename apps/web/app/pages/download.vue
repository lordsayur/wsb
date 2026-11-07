<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageHeader from '~/components/organisms/PageHeader.vue'
import PlatformCard from '~/components/molecules/PlatformCard.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { PLATFORMS } from '~/utils/platforms'
import { copyText } from '~/utils/clipboard'

async function onCopy(command: string) {
  try {
    await copyText(command)
  } catch {
    // specs/web/spec.md — clipboard can be blocked; the command is still shown.
  }
}

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
      <PageHeader
        :title="t('downloads.title')"
        :intro="t('downloads.intro')"
      />

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
            :command="platform.command"
            :screenshot="platform.screenshot"
            :screenshot-alt="platform.screenshot ? t('downloads.screenshots.tui') : undefined"
            :command-label="t('downloads.terminal')"
            :copy-label="t('downloads.copy')"
            :copied-label="t('downloads.copied')"
            :zoom-label="t('downloads.zoom')"
            :close-label="t('downloads.close')"
            :zoom-in-label="t('downloads.zoomIn')"
            :zoom-out-label="t('downloads.zoomOut')"
            @copy="onCopy"
          />
          <p v-if="platform.installNote" class="note">
            {{ t(`downloads.installNote.${platform.installNote}`) }}
          </p>
        </div>
      </div>

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
</style>
