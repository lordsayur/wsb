<template>
  <div class="range-selector">
    <div class="segments" role="group" :aria-label="label" @keydown="onGroupKeydown">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === value"
        :class="{ active: option.value === value }"
        @click="emit('update:range', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="stepper">
      <button
        type="button"
        class="step"
        :aria-label="prevLabel"
        @click="emit('shift', -1)"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button v-if="!current" type="button" class="today" @click="emit('today')">
        {{ todayLabel }}
      </button>
      <button
        type="button"
        class="step"
        :aria-label="nextLabel"
        @click="emit('shift', 1)"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: switch the chart range and step through it.
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface RangeOption<T extends string = string> {
  value: T
  label: string
}

defineProps<{
  label: string
  value: string
  options: RangeOption[]
  current: boolean
  prevLabel: string
  nextLabel: string
  todayLabel: string
}>()

const emit = defineEmits<{
  'update:range': [value: string]
  shift: [delta: number]
  today: []
}>()
</script>

<style scoped>
.range-selector {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.segments {
  display: flex;
  flex: 1;
  min-width: 0;
  height: var(--control-h);
  padding: 0.2rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.segments button {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-size: 0.78rem;
  padding: 0 0.25rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.segments button.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  height: var(--control-h);
  padding: 0 0.2rem;
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
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
}
.step:hover,
.today:hover {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.today {
  font: inherit;
  font-size: 0.72rem;
  padding: 0.2rem 0.4rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  white-space: nowrap;
}
</style>
