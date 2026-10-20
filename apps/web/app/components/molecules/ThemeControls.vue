<template>
  <section class="theme-controls">
    <p class="heading">{{ modeLabel }}</p>
    <div class="modes" role="group" :aria-label="modeLabel" @keydown="onGroupKeydown">
      <button
        v-for="option in modes"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === mode"
        @click="emit('update:mode', option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <p class="heading">{{ paletteLabel }}</p>
    <div class="palettes" role="group" :aria-label="paletteLabel" @keydown="onGroupKeydown">
      <button
        v-for="option in paletteOptions"
        :key="option.id"
        type="button"
        class="swatch"
        :class="{ active: option.id === palette }"
        :style="{ '--swatch': option.color }"
        :aria-label="option.label"
        :title="option.label"
        :aria-pressed="option.id === palette"
        @click="emit('update:palette', option.id)"
      >
        <span aria-hidden="true" />
      </button>

      <label
        class="custom"
        :class="{ active: palette === 'custom' }"
        :style="{ '--swatch': custom }"
      >
        <span class="custom-swatch" />
        <span class="custom-label">{{ customLabel }}</span>
        <input
          type="color"
          :value="custom"
          :aria-label="customLabel"
          @input="emit('update:custom', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: theme mode + palette choices, prop-driven.
import type { PaletteId, ThemeMode } from '~/utils/theme'
import { onGroupKeydown } from '~/utils/rovingFocus'

export interface ModeOption {
  value: ThemeMode
  label: string
}

export interface PaletteOption {
  id: PaletteId
  label: string
  color: string
}

defineProps<{
  modeLabel: string
  mode: ThemeMode
  modes: ModeOption[]
  paletteLabel: string
  palette: PaletteId
  paletteOptions: PaletteOption[]
  custom: string
  customLabel: string
}>()

const emit = defineEmits<{
  'update:mode': [value: ThemeMode]
  'update:palette': [value: PaletteId]
  'update:custom': [value: string]
}>()
</script>

<style scoped>
.theme-controls {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.heading {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.modes {
  display: flex;
  gap: 0.4rem;
}
.modes button {
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
}
.modes button[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
.palettes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.swatch,
.custom-swatch {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--swatch);
  border: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
}
.swatch {
  display: grid;
  place-items: center;
  padding: 3px;
  background: transparent;
  cursor: pointer;
}
.swatch span {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--swatch);
}
.swatch.active {
  outline: 2px solid var(--swatch);
  outline-offset: 1px;
}
.custom {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 2px 0.5rem 2px 2px;
  border-radius: 999px;
  border: 1px solid var(--border);
  cursor: pointer;
}
.custom.active {
  border-color: var(--swatch);
  outline: 1px solid var(--swatch);
}
.custom-label {
  font-size: 0.75rem;
}
.custom input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
