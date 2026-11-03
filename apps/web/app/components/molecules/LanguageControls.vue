<template>
  <section class="language-controls">
    <p class="heading">{{ label }}</p>
    <div
      class="languages"
      role="radiogroup"
      :aria-label="label"
      @keydown="onGroupKeydown"
    >
      <button
        v-for="option in options"
        :key="option.code"
        type="button"
        role="radio"
        :aria-checked="option.code === locale"
        :aria-pressed="option.code === locale"
        @click="emit('update:locale', option.code)"
      >
        {{ option.name }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: language choice, prop-driven.
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface LanguageOption {
  code: string
  name: string
}

defineProps<{
  label: string
  locale: string
  options: LanguageOption[]
}>()

const emit = defineEmits<{ 'update:locale': [value: string] }>()
</script>

<style scoped>
.language-controls {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.heading {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.languages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.languages button {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
}
.languages button[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
</style>
