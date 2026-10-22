<template>
  <button
    type="button"
    class="zoom-trigger"
    :aria-label="zoomLabel"
    @click="open"
  >
    <img
      class="thumb"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
    >
    <span class="hint" aria-hidden="true">
      <Icon name="lucide:maximize-2" />
    </span>
  </button>

  <dialog ref="dialog" class="lightbox" @click="onBackdrop" @cancel.prevent="close">
    <div class="stage" @click.stop>
      <div
        ref="scroller"
        class="scroller"
        :class="{ zoomed }"
        role="group"
        :aria-label="zoomLabel"
        tabindex="0"
        @pointerdown="onGrab"
        @pointermove="onDrag"
        @pointerup="release"
        @pointercancel="release"
        @click="toggleZoom"
      >
        <img
          class="full"
          :src="src"
          :alt="alt"
          draggable="false"
          decoding="async"
        >
      </div>
      <div class="caption">
        <span class="text">{{ alt }}</span>
        <span class="hint-text">{{ zoomed ? zoomOutLabel : zoomInLabel }}</span>
        <button type="button" class="close" @click="close">
          <Icon name="lucide:x" aria-hidden="true" />
          {{ closeLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: a screenshot that opens full size on click.
// The native modal <dialog> handles Esc, focus trapping and the backdrop. The
// stage fills the screen; a wide panorama is readable on a phone because it can
// be scrolled and dragged, and clicking toggles a 1:1 zoom at the click point,
// so no pinch gesture is needed.
import { onBeforeUnmount, ref } from 'vue'

defineProps<{
  src: string
  alt: string
  zoomLabel: string
  closeLabel: string
  zoomInLabel: string
  zoomOutLabel: string
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const zoomed = ref(false)
let drag: { x: number; y: number; left: number; top: number; moved: boolean } | null = null

function open() {
  zoomed.value = false
  dialog.value?.showModal()
}

function close() {
  drag = null
  dialog.value?.close()
}

/** A click outside the stage closes; clicks inside it do not. */
function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) close()
}

/** One click zooms to 1:1 (and back), centred where the pointer landed. */
function toggleZoom(event: MouseEvent) {
  const stage = scroller.value
  if (!stage || drag?.moved) return
  if (zoomed.value) {
    zoomed.value = false
    return
  }
  const box = stage.getBoundingClientRect()
  const ratioX = (event.clientX - box.left + stage.scrollLeft) / box.width
  const ratioY = (event.clientY - box.top + stage.scrollTop) / box.height
  zoomed.value = true
  requestAnimationFrame(() => {
    const width = stage.scrollWidth
    const height = stage.scrollHeight
    stage.scrollLeft = Math.max(0, ratioX * width - stage.clientWidth / 2)
    stage.scrollTop = Math.max(0, ratioY * height - stage.clientHeight / 2)
  })
}

function onGrab(event: PointerEvent) {
  const stage = scroller.value
  if (!stage || event.button !== 0) return
  drag = {
    x: event.clientX,
    y: event.clientY,
    left: stage.scrollLeft,
    top: stage.scrollTop,
    moved: false,
  }
}

function onDrag(event: PointerEvent) {
  const stage = scroller.value
  if (!stage || !drag) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (Math.abs(dx) + Math.abs(dy) > 3) {
    drag.moved = true
    stage.setPointerCapture?.(event.pointerId)
  }
  if (!drag.moved) return
  stage.scrollLeft = drag.left - dx
  stage.scrollTop = drag.top - dy
}

function release(event: PointerEvent) {
  scroller.value?.releasePointerCapture?.(event.pointerId)
  // Keep `moved` until the click that follows the pointerup has been seen.
  setTimeout(() => (drag = null), 0)
}

onBeforeUnmount(() => {
  drag = null
})
</script>

<style scoped>
.zoom-trigger {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #0b1020;
  cursor: zoom-in;
  overflow: hidden;
}
.zoom-trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.thumb {
  display: block;
  width: 100%;
  height: auto;
}
.hint {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 6px;
  background: rgb(0 0 0 / 55%);
  color: #e2e8f0;
  opacity: 0;
  transition: opacity 120ms ease;
}
.zoom-trigger:hover .hint,
.zoom-trigger:focus-visible .hint {
  opacity: 1;
}
.lightbox {
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgb(4 8 16 / 96%);
}
.lightbox::backdrop {
  background: rgb(4 8 16 / 85%);
}
.stage {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 1rem;
  gap: 0.6rem;
}
.scroller {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
  touch-action: pan-x pan-y;
  overscroll-behavior: contain;
}
.scroller.zoomed {
  align-items: flex-start;
  justify-content: flex-start;
  cursor: zoom-out;
}
.scroller:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.full {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #0b1020;
  user-select: none;
}
.zoomed .full {
  max-width: none;
  max-height: none;
}
.caption {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #cbd5e1;
}
.text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hint-text {
  margin-left: auto;
  flex: none;
  opacity: 0.7;
}
.close {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: none;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 25%);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
@media (max-width: 600px) {
  .stage { padding: 0.5rem; }
  .hint-text { display: none; }
}
</style>
