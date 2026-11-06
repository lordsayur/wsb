<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import NotificationItem from '~/components/molecules/NotificationItem.vue'
import { formatDate } from '@wsb/core'
import { announcementText } from '@wsb/data/notifications'
import { useNotifications } from '~/composables/useNotifications'

// specs/notifications/spec.md — the reader's feed: newer versions and active
// announcements. Opening it acknowledges everything it shows.
const { t, locale } = useI18n()
const { feed, state, open } = useNotifications()

const versionItems = computed(() =>
  feed.value.versions.map((entry) => ({
    version: entry.version,
    title: t('notifications.versionTitle', { version: entry.version }),
    body: entry.changes[0] ?? '',
    changes: entry.changes.slice(1),
    date: entry.date,
  })),
)

const announcementItems = computed(() =>
  feed.value.announcements.map((announcement) => {
    const message = announcementText(announcement, locale.value)
    return {
      id: announcement.id,
      title: message.title,
      body: message.body,
      link: announcement.link,
      date: announcement.publishedAt.slice(0, 10),
    }
  }),
)

const isEmpty = computed(
  () => versionItems.value.length === 0 && announcementItems.value.length === 0,
)

function dateLabel(date: string) {
  return formatDate(date.slice(0, 10), locale.value)
}

onMounted(() => void open())

useSeoMeta({ title: () => t('notifications.title') })
</script>

<template>
  <div class="page">
    <main class="content">
      <header class="head">
        <h1 class="title">{{ t('notifications.title') }}</h1>
      </header>
      <p class="intro">{{ t('notifications.intro') }}</p>

      <p v-if="state !== 'ready'" class="state" role="status">
        {{ t('state.loading') }}
      </p>

      <p v-else-if="isEmpty" class="state">{{ t('notifications.empty') }}</p>

      <div v-else class="list">
        <NotificationItem
          v-for="item in versionItems"
          :key="`version-${item.version}`"
          kind="version"
          :kind-label="t('notifications.versionKind')"
          :title="item.title"
          :body="item.body"
          :changes="item.changes"
          :date="item.date"
          :date-label="dateLabel(item.date)"
          link="/changelog"
          :link-label="t('notifications.viewChanges')"
        />
        <NotificationItem
          v-for="item in announcementItems"
          :key="`announcement-${item.id}`"
          kind="announcement"
          :kind-label="t('notifications.announcementKind')"
          :title="item.title"
          :body="item.body"
          :date="item.date"
          :date-label="dateLabel(item.date)"
          :link="item.link || undefined"
          :link-label="t('notifications.openLink')"
        />
      </div>

      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('notifications.back') }}
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
  max-width: 34rem;
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
.intro,
.state {
  margin: 0;
  opacity: 0.75;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
</style>
