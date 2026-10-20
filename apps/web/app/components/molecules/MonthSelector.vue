<template>
  <div class="month-selector">
    <button
      type="button"
      class="step"
      :aria-label="prevLabel"
      @click="emit('shift', -1)"
    >
      <Icon name="lucide:chevron-left" aria-hidden="true" />
    </button>

    <button
      v-if="!current"
      type="button"
      class="label"
      :aria-label="`${title} — ${todayLabel}`"
      @click="emit('today')"
    >
      {{ title }}
    </button>
    <p v-else class="label" :aria-label="label">{{ title }}</p>

    <button
      type="button"
      class="step"
      :aria-label="nextLabel"
      @click="emit('shift', 1)"
    >
      <Icon name="lucide:chevron-right" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: step through months; no month math here.
defineProps<{
  label: string
  title: string
  /** True when the shown month is the current Brunei month. */
  current: boolean
  prevLabel: string
  nextLabel: string
  todayLabel: string
}>()

const emit = defineEmits<{
  shift: [delta: number]
  today: []
}>()
</script>

<style scoped>
.month-selector {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  height: var(--control-h);
  padding: 0 0.25rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.step {
  font: inherit;
  font-size: 1.25rem;
  line-height: 1;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border-radius: 6px;
  border: 0;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
}
.step:hover {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.label {
  flex: 1;
  min-width: 0;
  margin: 0;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fg);
}
button.label {
  border: 0;
  padding: 0.2rem;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
button.label:hover {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
</style>
