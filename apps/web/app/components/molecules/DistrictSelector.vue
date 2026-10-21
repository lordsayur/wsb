<template>
  <div
    class="district-selector"
    role="radiogroup"
    :aria-label="label"
    @keydown="onGroupKeydown"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :title="option.label"
      :class="{ active: option.value === modelValue }"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: inline district radio group, no offset logic.
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface DistrictOption {
  value: string
  label: string
}

defineProps<{
  label: string
  modelValue: string
  options: DistrictOption[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.district-selector {
  flex: 1;
  min-width: 0;
  display: flex;
  height: var(--control-h);
  padding: 0.2rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.district-selector button {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-size: clamp(0.62rem, 3vw, 0.78rem);
  line-height: 1.05;
  padding: 0 0.15rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  text-align: center;
  text-wrap: balance;
  overflow: hidden;
}
.district-selector button.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
</style>
