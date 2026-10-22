<template>
  <article class="ayah-card">
    <div
      ref="pane"
      class="texts"
      role="group"
      :tabindex="0"
      :aria-label="passageLabel"
    >
      <template v-if="loading && texts.length === 0">
        <div class="skeleton" aria-hidden="true" />
      </template>
      <template v-else-if="unavailable">
        <p class="unavailable" role="alert">{{ unavailableLabel }}</p>
        <button type="button" class="retry" @click="emit('retry')">
          {{ retryLabel }}
        </button>
      </template>
      <template v-else>
        <AyahText
          v-for="(text, i) in texts"
          :key="i"
          :text="text ?? ''"
          :label="i === 0 ? ayahLabel : undefined"
        />
      </template>
    </div>

    <div v-if="revealed.juz || revealed.surah || revealed.ayah" class="facts">
      <span v-if="revealed.juz">{{ juzLabel }}</span>
      <span v-if="revealed.surah">{{ surahLabel }}</span>
      <span v-if="revealed.ayah">{{ ayahNumberLabel }}</span>
    </div>

    <div class="actions">
      <button type="button" class="primary" @click="emit('next')" :disabled="atEnd">
        {{ nextLabel }}
      </button>
      <button type="button" @click="emit('newAyah')">{{ newAyahLabel }}</button>
      <button type="button" @click="emit('changeFilter')">
        {{ changeFilterLabel }}
      </button>
    </div>

    <p v-if="atEnd" class="end" role="status">{{ endLabel }}</p>
  </article>
</template>

<script setup lang="ts">
// specs/quran/spec.md — organism: the reading state. Arabic only until the
// reader reveals a hint; the host owns all state and text loading.
import { nextTick, ref, watch } from 'vue'
import type { Reveal } from '@wsb/core'
import AyahText from '../atoms/AyahText.vue'

const props = withDefaults(
  defineProps<{
    texts: readonly (string | null)[]
    revealed: Reveal
    juzLabel: string
    surahLabel: string
    ayahNumberLabel: string
    passageLabel: string
    ayahLabel: string
    nextLabel: string
    newAyahLabel: string
    changeFilterLabel: string
    endLabel: string
    unavailableLabel: string
    retryLabel: string
    loading?: boolean
    unavailable?: boolean
    atEnd?: boolean
  }>(),
  { loading: false, unavailable: false, atEnd: false },
)

const pane = ref<HTMLElement | null>(null)
let shown = 0

watch(
  () => props.texts.length,
  async (length) => {
    if (length <= shown) {
      shown = length
      return
    }
    shown = length
    await nextTick()
    pane.value?.scrollTo({ top: pane.value.scrollHeight, behavior: 'smooth' })
  },
  { immediate: true },
)

const emit = defineEmits<{
  next: []
  newAyah: []
  changeFilter: []
  retry: []
}>()
</script>

<style scoped>
.ayah-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.texts {
  display: flex;
  flex-direction: column;
  height: min(55vh, 30rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.texts:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.texts > .ayah-text + .ayah-text {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.facts span {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 999px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.actions button {
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
.actions .primary {
  background: var(--primary);
  color: var(--primary-fg);
  border-color: transparent;
  font-weight: 600;
}
.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.skeleton {
  height: 5rem;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--surface-2) 25%,
    color-mix(in srgb, var(--surface-2) 60%, var(--fg) 8%) 50%,
    var(--surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
.unavailable {
  margin: 0;
  color: var(--muted);
}
.retry {
  align-self: flex-start;
  font: inherit;
  color: var(--fg);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
}
.end {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
