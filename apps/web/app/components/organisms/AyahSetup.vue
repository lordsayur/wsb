<template>
  <section class="ayah-setup">
    <header class="head">
      <h1 class="title">{{ title }}</h1>
      <p class="intro">{{ intro }}</p>
    </header>

    <RangePicker
      :juz-label="juzLabel"
      :surah-label="surahLabel"
      :search-placeholder="searchPlaceholder"
      :from-label="fromLabel"
      :to-label="toLabel"
      :start-label="startLabel"
      :empty-label="emptyLabel"
      :empty-reason="emptyReason"
      :disabled="disabled"
      :locale="locale"
      :index="index"
      :juz-min="juzMin"
      :juz-max="juzMax"
      :juz-max-value="juzMaxValue"
      :surah-min="surahMin"
      :surah-max="surahMax"
      :sura-max="suraMax"
      @update:juz-min="emit('update:juzMin', $event)"
      @update:juz-max="emit('update:juzMax', $event)"
      @update:surah-min="emit('update:surahMin', $event)"
      @update:surah-max="emit('update:surahMax', $event)"
      @select-surah="emit('selectSurah', $event)"
      @start="emit('start')"
    />

    <p class="count" role="status">
      {{ countLabel }}
    </p>

    <SourceNote :label="attributionLabel" :name="attributionName" :url="attributionUrl" />
  </section>
</template>

<script setup lang="ts">
// specs/quran/spec.md — organism: the setup state. No ayah is picked or
// fetched until Start; the page owns the draft selection.
import type { QuranIndex } from '@wsb/core'
import SourceNote from '../molecules/SourceNote.vue'
import RangePicker from '../molecules/RangePicker.vue'

defineProps<{
  title: string
  intro: string
  juzLabel: string
  surahLabel: string
  searchPlaceholder: string
  fromLabel: string
  toLabel: string
  startLabel: string
  emptyLabel: string
  emptyReason: string
  countLabel: string
  attributionLabel: string
  attributionName: string
  attributionUrl: string
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
</script>

<style scoped>
.ayah-setup {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.intro {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}
.count {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
