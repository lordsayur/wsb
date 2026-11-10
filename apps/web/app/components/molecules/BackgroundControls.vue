<template>
  <section class="background">
    <p class="heading">{{ label }}</p>
    <div class="options" role="group" :aria-label="label" @keydown="onGroupKeydown">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === background"
        @click="emit('update:background', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: the summary backdrop choice, prop-driven. The
// wall is the default; the flat aurora stays one tap away.
import type { BackgroundStyle } from '~/utils/background'
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface BackgroundOption {
  value: BackgroundStyle
  label: string
}

defineProps<{
  label: string
  background: BackgroundStyle
  options: BackgroundOption[]
}>()

const emit = defineEmits<{ 'update:background': [value: BackgroundStyle] }>()
</script>

<style scoped>
.background {
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
