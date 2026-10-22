<template>
  <div class="range-picker">
    <div class="field">
      <span class="label">{{ juzLabel }}</span>
      <div class="pair">
        <input
          type="number"
          inputmode="numeric"
          min="1"
          :max="juzMaxValue"
          :aria-label="`${juzLabel} ${fromLabel}`"
          :value="juzMin"
          @change="emit('update:juzMin', read($event))"
        />
        <span class="dash" aria-hidden="true">–</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          :max="juzMaxValue"
          :aria-label="`${juzLabel} ${toLabel}`"
          :value="juzMax"
          @change="emit('update:juzMax', read($event))"
        />
      </div>
    </div>

    <SurahSearch
      :label="surahLabel"
      :placeholder="searchPlaceholder"
      :empty-label="emptyLabel"
      :index="index"
      :locale="locale"
      @select="emit('selectSurah', $event)"
    />

    <div class="field">
      <span class="label">{{ surahLabel }}</span>
      <div class="pair">
        <input
          type="number"
          inputmode="numeric"
          min="1"
          :max="suraMax"
          :aria-label="`${surahLabel} ${fromLabel}`"
          :value="surahMin"
          @change="emit('update:surahMin', read($event))"
        />
        <span class="dash" aria-hidden="true">–</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          :max="suraMax"
          :aria-label="`${surahLabel} ${toLabel}`"
          :value="surahMax"
          @change="emit('update:surahMax', read($event))"
        />
      </div>
    </div>

    <button
      type="button"
      class="start"
      :disabled="disabled"
      :title="disabled ? emptyReason : undefined"
      @click="emit('start')"
    >
      {{ startLabel }}
    </button>
    <p v-if="disabled" class="reason" role="status">{{ emptyReason }}</p>
  </div>
</template>

<script setup lang="ts">
// specs/quran/spec.md — molecule: the juz and surah ranges plus Start. Purely
// prop-driven; the page owns the selection and the intersection count.
import type { QuranIndex } from '@wsb/core'
import SurahSearch from './SurahSearch.vue'

defineProps<{
  juzLabel: string
  surahLabel: string
  searchPlaceholder: string
  fromLabel: string
  toLabel: string
  startLabel: string
  emptyLabel: string
  emptyReason: string
  disabled: boolean
  locale: string
  index: QuranIndex
  juzMin: number
  juzMax: number
  juzMaxValue: number
  surahMin: number
  surahMax: number
  suraMax: number
}>()

const emit = defineEmits<{
  'update:juzMin': [value: number]
  'update:juzMax': [value: number]
  'update:surahMin': [value: number]
  'update:surahMax': [value: number]
  selectSurah: [surah: number]
  start: []
}>()

function read(event: Event): number {
  const input = event.target as HTMLInputElement
  return Number(input.value)
}
</script>

<style scoped>
.range-picker {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.label {
  font-size: 0.8rem;
  color: var(--muted);
}
.pair {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pair input {
  width: 5.5rem;
  height: var(--control-h);
  padding: 0 0.6rem;
  font: inherit;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.dash {
  color: var(--muted);
}
.start {
  height: var(--control-h);
  font: inherit;
  font-weight: 600;
  border: 0;
  border-radius: 8px;
  background: var(--primary);
  color: var(--primary-fg);
  cursor: pointer;
}
.start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.reason {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
