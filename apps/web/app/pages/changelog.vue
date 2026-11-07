<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageHeader from '~/components/organisms/PageHeader.vue'
import VersionBadge from '~/components/molecules/VersionBadge.vue'
import { formatDate } from '@wsb/core'
import { APP_VERSION, CHANGELOG, isBeta } from '~/utils/changelog'

// specs/release/spec.md — /changelog: every version, newest first, with the
// running one marked.
const { t, locale } = useI18n()

const entries = computed(() =>
  CHANGELOG.entries.map((entry) => ({
    ...entry,
    current: entry.version === APP_VERSION,
    dateLabel: formatDate(entry.date, locale.value),
  })),
)

useSeoMeta({
  title: () => t('changelog.title'),
  description: () => t('changelog.intro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <PageHeader
        :title="t('changelog.title')"
        :intro="t('changelog.intro')"
      >
        <template #badge>
          <VersionBadge
            :version="APP_VERSION"
            :beta="isBeta()"
            :beta-label="t('about.beta')"
          />
        </template>
      </PageHeader>

      <ol class="entries">
        <li v-for="entry in entries" :key="entry.version" class="entry">
          <header class="entry-head">
            <h2 class="version">
              {{ entry.version }}
              <span v-if="entry.current" class="current">
                {{ t('changelog.current') }}
              </span>
            </h2>
            <time class="date" :datetime="entry.date">{{ entry.dateLabel }}</time>
          </header>
          <ul class="changes">
            <li v-for="change in entry.changes" :key="change">{{ change }}</li>
          </ul>
        </li>
      </ol>

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
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.75rem;
}
.entries {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.entry {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.entry-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}
.version {
  margin: 0;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}
.current {
  margin-inline-start: 0.4rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-fg);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.date {
  font-size: 0.75rem;
  color: var(--muted);
}
.changes {
  margin: 0;
  padding-inline-start: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  opacity: 0.85;
}
</style>
