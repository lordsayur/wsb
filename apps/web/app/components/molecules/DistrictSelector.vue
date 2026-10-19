<template>
  <div class="district-selector">
    <select
      :value="modelValue"
      :aria-label="label"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: select a District, no offset logic here.
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
}
select {
  font: inherit;
  width: 100%;
  height: var(--control-h);
  padding: 0 0.75rem;
  border-radius: 8px;
  background: var(--surface);
  color: var(--fg);
  border: 1px solid var(--border);
  cursor: pointer;
}
</style>
