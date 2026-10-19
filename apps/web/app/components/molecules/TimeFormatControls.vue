<template>
  <section class="time-format">
    <p class="heading">{{ label }}</p>
    <div class="options" role="group" :aria-label="label">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === format"
        @click="emit('update:format', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: 12/24-hour choice, prop-driven.
import type { TimeFormat } from '@wsb/core'

export interface TimeFormatOption {
  value: TimeFormat
  label: string
}

defineProps<{
  label: string
  format: TimeFormat
  options: TimeFormatOption[]
}>()

const emit = defineEmits<{ 'update:format': [value: TimeFormat] }>()
</script>

<style scoped>
.time-format {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.heading {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.options {
  display: flex;
  gap: 0.4rem;
}
.options button {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
}
.options button[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
</style>
