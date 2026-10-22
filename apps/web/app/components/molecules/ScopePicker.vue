<template>
  <div class="scope-picker">
    <div class="field">
      <span class="label">{{ scopeLabel }}</span>
      <div class="modes" role="group" :aria-label="scopeLabel">
        <button
          v-for="mode in modes"
          :key="mode.kind"
          type="button"
          :aria-pressed="scope.kind === mode.kind"
          :class="{ active: scope.kind === mode.kind }"
          @click="emit('selectScope', mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div v-if="scope.kind === 'juz'" class="field">
      <label class="label" :for="juzId">{{ juzLabel }}</label>
      <select
        :id="juzId"
        :value="scope.juz"
        @change="emit('selectScope', { kind: 'juz', juz: read($event) })"
      >
        <option v-for="juz in juzMaxValue" :key="juz" :value="juz">
          {{ juzLabel }} {{ juz }}
        </option>
      </select>
    </div>

    <div v-else-if="scope.kind === 'surah'" class="field">
      <SurahSearch
        :label="surahLabel"
        :placeholder="searchPlaceholder"
        :empty-label="emptyLabel"
        :index="index"
        :locale="locale"
        @select="emit('selectScope', { kind: 'surah', surah: $event })"
      />
      <p v-if="sura" class="chosen">{{ surahDisplay(sura, locale) }}</p>
    </div>

    <button type="button" class="start" :disabled="disabled" @click="emit('start')">
      {{ startLabel }}
    </button>
    <p v-if="disabled" class="reason" role="status">{{ emptyReason }}</p>
  </div>
</template>

<script setup lang="ts">
// specs/quran/spec.md — molecule: exactly one scope (all, one juz, one surah)
// plus Start. Juz and surah are alternatives; the page owns the scope.
import { computed, useId } from 'vue'
import type { QuranIndex, Scope } from '@wsb/core'
import { surahDisplay } from '~/utils/quran'
import SurahSearch from './SurahSearch.vue'

const props = defineProps<{
  scopeLabel: string
  allLabel: string
  juzLabel: string
  surahLabel: string
  searchPlaceholder: string
  startLabel: string
  emptyLabel: string
  emptyReason: string
  disabled: boolean
  locale: string
  index: QuranIndex
  scope: Scope
  juzMaxValue: number
}>()

const emit = defineEmits<{
  selectScope: [scope: Scope]
  start: []
}>()

const juzId = useId()

const modes = computed(() => [
  { kind: 'all', value: { kind: 'all' } as Scope, label: props.allLabel },
  { kind: 'juz', value: { kind: 'juz', juz: 1 } as Scope, label: props.juzLabel },
  { kind: 'surah', value: { kind: 'surah', surah: 1 } as Scope, label: props.surahLabel },
])

const sura = computed(() =>
  props.scope.kind === 'surah'
    ? (props.index.suras[props.scope.surah - 1] ?? null)
    : null,
)

function read(event: Event): number {
  return Number((event.target as HTMLSelectElement).value)
}
</script>

<style scoped>
.scope-picker {
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
.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.modes button {
  min-height: var(--control-h);
  padding: 0 0.9rem;
  font: inherit;
  font-size: 0.9rem;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}
.modes button.active {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
}
select {
  width: 100%;
  height: var(--control-h);
  padding: 0 0.6rem;
  font: inherit;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.chosen {
  margin: 0;
  font-size: 0.85rem;
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
