<template>
  <section class="prayer-list">
    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'unavailable'" class="state">
      {{ unavailableText }}
    </p>
    <template v-else>
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
  }>(),
  {
    rows: () => [],
    loadingText: 'Loading…',
    unavailableText: 'Prayer times are unavailable.',
    offlineText: '',
    nextText: '',
  },
)
</script>

<style scoped>
.prayer-list {
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
.next {
  font-weight: 600;
}
</style>
