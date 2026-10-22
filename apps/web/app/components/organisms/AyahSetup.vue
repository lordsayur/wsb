<template>
  <section class="ayah-setup">
    <header class="head">
      <h1 class="title">{{ title }}</h1>
      <p class="intro">{{ intro }}</p>
    </header>

    <ScopePicker
      :scope-label="scopeLabel"
      :all-label="allLabel"
      :juz-label="juzLabel"
      :from-label="fromLabel"
      :to-label="toLabel"
      :surah-label="surahLabel"
      :search-placeholder="searchPlaceholder"
      :start-label="startLabel"
      :empty-label="emptyLabel"
      :empty-reason="emptyReason"
      :disabled="disabled"
      :locale="locale"
      :index="index"
      :scope="scope"
      :juz-max-value="juzMaxValue"
      @select-scope="emit('selectScope', $event)"
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
// fetched until Start; the page owns the draft scope.
import type { QuranIndex, Scope } from '@wsb/core'
import SourceNote from '../molecules/SourceNote.vue'
import ScopePicker from '../molecules/ScopePicker.vue'

defineProps<{
  title: string
  intro: string
  scopeLabel: string
  allLabel: string
  juzLabel: string
  fromLabel: string
  toLabel: string
  surahLabel: string
  searchPlaceholder: string
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
  scope: Scope
  juzMaxValue: number
}>()

const emit = defineEmits<{
  selectScope: [scope: Scope]
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
