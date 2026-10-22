<template>
  <div class="surah-search">
    <label class="label" :for="id">{{ label }}</label>
    <input
      :id="id"
      type="search"
      autocomplete="off"
      :placeholder="placeholder"
      :value="query"
      @input="query = ($event.target as HTMLInputElement).value"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="choose(highlighted)"
    />
    <ul v-if="query.trim()" class="results" role="listbox" :aria-label="label">
      <li v-for="(sura, i) in results" :key="sura.n" role="none">
        <button
          type="button"
          role="option"
          :aria-selected="i === highlighted"
          :class="{ active: i === highlighted }"
          @click="choose(i)"
        >
          <span class="names">
            <span class="arabic" dir="rtl" lang="ar">{{ sura.ar }}</span>
            <span class="name">{{ nameOf(sura) }}</span>
          </span>
          <span class="meta">{{ sura.n }} · {{ sura.ayahs }}</span>
        </button>
      </li>
      <li v-if="results.length === 0" class="empty" role="status">
        {{ emptyLabel }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// specs/quran/spec.md — molecule: Latin fuzzy search over the surah names.
// Every result shows the Arabic name; only Malay/English/Latin names match.
import { computed, ref, useId } from 'vue'
import { searchSurah, type QuranIndex, type QuranSura } from '@wsb/core'
import { surahName } from '~/utils/quran'

const props = defineProps<{
  label: string
  placeholder: string
  emptyLabel: string
  index: QuranIndex
  locale: string
}>()

const emit = defineEmits<{ select: [surah: number] }>()

const id = useId()
const query = ref('')
const highlighted = ref(0)

const results = computed(() =>
  query.value.trim()
    ? searchSurah(props.index, query.value).slice(0, 8)
    : [],
)

function nameOf(sura: QuranSura) {
  return surahName(sura, props.locale)
}

function move(delta: number) {
  if (!results.value.length) return
  const size = results.value.length
  highlighted.value = (highlighted.value + delta + size) % size
}

function choose(index: number) {
  const sura = results.value[index]
  if (!sura) return
  emit('select', sura.n)
  query.value = ''
  highlighted.value = 0
}
</script>

<style scoped>
.surah-search {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.label {
  font-size: 0.8rem;
  color: var(--muted);
}
input {
  height: var(--control-h);
  padding: 0 0.7rem;
  font: inherit;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.results {
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}
.results button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.45rem 0.5rem;
  font: inherit;
  text-align: start;
  color: var(--fg);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.results button.active,
.results button:hover {
  background: var(--surface-2);
}
.names {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.arabic {
  font-family: 'Noto Naskh Arabic', system-ui, sans-serif;
  font-size: 1.05rem;
  line-height: 1.6;
}
.name {
  font-size: 0.9rem;
}
.meta {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  align-self: center;
}
.empty {
  padding: 0.45rem 0.5rem;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
