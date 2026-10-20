<template>
  <section class="prayer-list">
    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'unavailable'" class="state">
      {{ unavailableText }}
    </p>
    <template v-else>
      <p
        v-if="refreshing"
        class="state refreshing"
        role="status"
        aria-live="polite"
      >
        <span class="spinner" aria-hidden="true" />
        {{ refreshingText }}
      </p>
      <p v-if="offlineText" class="state offline">{{ offlineText }}</p>
      <p v-if="nextText" class="state next">{{ nextText }}</p>
      <PrayerRow
        v-for="row in rows"
        :key="row.prayer"
        :label="row.label"
        :time="row.time"
        :current="row.current"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: renders state from core, no time math.
import PrayerRow from '../molecules/PrayerRow.vue'

export interface PrayerRowModel {
  prayer: string
  label: string
  time: string
  current?: boolean
}

withDefaults(
  defineProps<{
    state: 'loading' | 'ready' | 'unavailable'
    rows?: PrayerRowModel[]
    loadingText?: string
    unavailableText?: string
    offlineText?: string
    nextText?: string
    refreshing?: boolean
    refreshingText?: string
  }>(),
  {
    rows: () => [],
    loadingText: 'Loading…',
    unavailableText: 'Prayer times are unavailable.',
    offlineText: '',
    nextText: '',
    refreshing: false,
    refreshingText: 'Updating…',
  },
)
</script>

<style scoped>
.prayer-list {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 26rem;
  font-size: clamp(1.1rem, 3.6vh, 1.9rem);
}
.prayer-list :deep(.prayer-row) {
  flex: 1;
  align-items: center;
  padding-block: 0.15rem;
}
.state {
  margin: 0.5rem 0;
}
.offline {
  font-size: 0.85rem;
  opacity: 0.75;
}
.refreshing {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.65rem;
  opacity: 0.8;
  pointer-events: none;
}
.spinner {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.next {
  font-weight: 600;
}
</style>
