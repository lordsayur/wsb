<template>
  <div class="ayah-row">
    <div class="controls">
      <button
        type="button"
        class="play"
        :class="status"
        :aria-label="status === 'playing' ? pauseLabel : playLabel"
        :aria-pressed="status === 'playing' || status === 'loading'"
        @click="emit('toggleAudio')"
      >
        <Icon :name="icon" aria-hidden="true" />
      </button>
      <button
        v-if="!shown"
        type="button"
        class="reveal-text"
        @click="emit('revealText')"
      >
        {{ revealLabel }}
      </button>
    </div>

    <AyahText v-if="shown" :text="text ?? ''" :label="label" />
    <div v-else class="skeleton" aria-hidden="true" />

    <p v-if="status === 'error'" class="error" role="alert">
      {{ errorLabel }}
      <button type="button" class="retry" @click="emit('toggleAudio')">
        {{ retryLabel }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
// specs/quran/spec.md — molecule: one ayah in the passage. The text stays out
// of the DOM until revealed; the circular control plays its own recitation.
import { computed } from 'vue'
import AyahText from '../atoms/AyahText.vue'

const props = withDefaults(
  defineProps<{
    text: string | null
    shown: boolean
    status?: 'idle' | 'loading' | 'playing' | 'error'
    playLabel: string
    pauseLabel: string
    revealLabel: string
    errorLabel: string
    retryLabel: string
    label?: string
  }>(),
  { status: 'idle', label: undefined },
)

const icon = computed(() => {
  if (props.status === 'loading') return 'lucide:loader-circle'
  if (props.status === 'playing') return 'lucide:pause'
  return 'lucide:play'
})

const emit = defineEmits<{ toggleAudio: []; revealText: [] }>()
</script>

<style scoped>
.ayah-row {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  font: inherit;
  color: var(--primary-fg);
  background: var(--primary);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
}
.play.playing {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
}
.play.loading :deep(svg) {
  animation: spin 1s linear infinite;
}
.reveal-text {
  min-height: 2rem;
  padding: 0 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  color: var(--fg);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.skeleton {
  height: 3.25rem;
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
.error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}
.retry {
  font: inherit;
  font-size: 0.8rem;
  color: var(--fg);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
