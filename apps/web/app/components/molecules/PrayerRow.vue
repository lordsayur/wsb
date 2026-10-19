<template>
  <article
    class="prayer-row"
    :class="{ current }"
    :aria-current="current ? 'true' : undefined"
  >
    <PrayerNameLabel :label="label" />
    <TimeText :text="time" />
  </article>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: composes atoms, prop-driven.
import PrayerNameLabel from '../atoms/PrayerNameLabel.vue'
import TimeText from '../atoms/TimeText.vue'

withDefaults(defineProps<{ label: string; time: string; current?: boolean }>(), {
  current: false,
})
</script>

<style scoped>
.prayer-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  border-bottom: 1px solid var(--border);
}
.prayer-row.current {
  font-weight: 700;
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border-bottom-color: transparent;
  box-shadow: inset 3px 0 0 var(--primary);
}
:dir(rtl) .prayer-row.current {
  box-shadow: inset -3px 0 0 var(--primary);
}
</style>
