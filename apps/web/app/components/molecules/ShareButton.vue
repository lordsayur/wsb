<template>
  <div class="share">
    <button
      type="button"
      class="share-button"
      :aria-label="label"
      :title="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      @pointerdown="startPress"
      @pointerup="endPress"
      @pointerleave="cancelPress"
      @pointercancel="cancelPress"
      @contextmenu.prevent="open = true"
      @keydown.down.prevent="open = true"
      @click="onClick"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </svg>
    </button>

    <div v-if="open" class="share-menu" role="menu">
      <button type="button" role="menuitem" @click="choose('formatted')">
        {{ formattedLabel }}
      </button>
      <button type="button" role="menuitem" @click="choose('raw')">
        {{ rawLabel }}
      </button>
    </div>

    <span class="status" role="status">{{ copied ? copiedLabel : '' }}</span>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: tap shares formatted text, press-and-hold
// opens the formatted/raw choice. Clipboard work stays in the shell.
import { onBeforeUnmount, ref } from 'vue'
import type { ShareFormat } from '~/utils/share'

const props = withDefaults(
  defineProps<{
    label: string
    formattedLabel?: string
    rawLabel?: string
    copiedLabel?: string
    copied?: boolean
    holdMs?: number
  }>(),
  {
    formattedLabel: 'Formatted text',
    rawLabel: 'Raw text',
    copiedLabel: '',
    copied: false,
    holdMs: 450,
  },
)

const emit = defineEmits<{ share: [format: ShareFormat] }>()

const open = ref(false)
const pressed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function startPress() {
  cancelPress()
  pressed.value = false
  timer = setTimeout(() => {
    pressed.value = true
    open.value = true
    if (navigator.vibrate) navigator.vibrate(10)
  }, props.holdMs)
}

function endPress() {
  clearTimeout(timer)
}

function cancelPress() {
  clearTimeout(timer)
  pressed.value = false
}

function onClick() {
  if (pressed.value) {
    pressed.value = false
    return
  }
  close()
  emit('share', 'formatted')
}

function choose(format: ShareFormat) {
  close()
  emit('share', format)
}

function close() {
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', onKeydown)
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
</script>

<style scoped>
.share {
  position: relative;
  display: flex;
}
.share-button {
  font: inherit;
  display: grid;
  place-items: center;
  width: var(--control-h);
  height: var(--control-h);
  padding: 0;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border);
  color: inherit;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  user-select: none;
}
.share-menu {
  position: absolute;
  inset-inline-end: 0;
  bottom: calc(100% + 0.35rem);
  z-index: 20;
  min-width: 9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.4rem;
  border-radius: 10px;
  background: var(--surface);
  color: var(--fg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.share-menu button {
  font: inherit;
  font-size: 0.85rem;
  text-align: start;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
}
.share-menu button:hover {
  background: color-mix(in srgb, var(--primary) 15%, transparent);
}
.status {
  position: absolute;
  inset-inline-end: 0;
  bottom: calc(100% + 0.35rem);
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  background: var(--surface);
  color: var(--fg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.status:empty {
  display: none;
}
</style>
