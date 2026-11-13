<template>
  <nav class="page-indicator" :aria-label="label">
    <button
      v-for="page in pages"
      :key="page.id"
      type="button"
      class="dot"
      :class="{ 'is-current': page.id === modelValue }"
      :aria-label="page.label"
      :aria-current="page.id === modelValue ? 'page' : undefined"
      :aria-pressed="page.id === modelValue"
      @click="emit('update:modelValue', page.id)"
    >
      <span class="visually-hidden">{{ page.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: one dot per home slide; tapping selects and
// the current slide is marked for assistive tech.
export interface PageOption {
  id: string
  label: string
}

withDefaults(
  defineProps<{ pages: PageOption[]; modelValue: string; label?: string }>(),
  { label: 'Pages' },
)

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
</script>

<style scoped>
.page-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;
  /* The dots follow the surface they sit on: the deck's chrome uses the
     theme's accent, the summary's overlay sets its own on the wall. */
  --dot-color: var(--primary);
}
.dot {
  width: 0.6rem;
  height: 0.6rem;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--dot-color);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease-out, transform 0.15s ease-out;
  /* Visible dot stays small; the hit area meets the touch target minimum. */
  outline: 0.55rem solid transparent;
  outline-offset: 0;
  box-sizing: content-box;
}
.dot.is-current {
  background: var(--dot-color);
  transform: scale(1.25);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
