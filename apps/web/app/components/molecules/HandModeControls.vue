<template>
  <section class="hand-mode">
    <p class="heading">{{ label }}</p>
    <div class="options" role="group" :aria-label="label" @keydown="onGroupKeydown">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === mode"
        @click="emit('update:mode', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: right/left-handed choice, prop-driven. The
// chosen hand is the side the menu controls sit on.
import type { HandMode } from '~/utils/handMode'
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface HandModeOption {
  value: HandMode
  label: string
}

defineProps<{
  label: string
  mode: HandMode
  options: HandModeOption[]
}>()

const emit = defineEmits<{ 'update:mode': [value: HandMode] }>()
</script>

<style scoped>
.hand-mode {
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
