<template>
  <nav
    class="page-indicator"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <button
      v-for="(page, index) in pages"
      :key="page.id"
      type="button"
      class="dot"
      :class="{ current: page.id === modelValue }"
      :aria-label="page.label"
      :aria-current="page.id === modelValue ? 'page' : undefined"
      :aria-pressed="page.id === modelValue"
      :tabindex="index === tabStop ? 0 : -1"
      @click="emit('update:modelValue', page.id)"
      @focus="tabStop = index"
    >
      <span class="visually-hidden">{{ page.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: circular page dots; current page highlighted.
// Arrow keys move between dots, Home/End jump to the ends.
import { computed, ref, watchEffect } from 'vue'
import { stepIndex } from '~/utils/rovingFocus'

export interface PageOption {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{ pages: PageOption[]; modelValue: string; label?: string }>(),
  {
    label: 'Pages',
  },
)

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const tabStop = ref(0)

const activeIndex = computed(() =>
  Math.max(
    0,
    props.pages.findIndex((page) => page.id === props.modelValue),
  ),
)

/** The selected dot is the group's single tab stop; keep it in sync. */
watchEffect(() => {
  tabStop.value = activeIndex.value
})

function onKeydown(event: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const dots = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button')]
  if (dots.length === 0) return
  event.preventDefault()
  const focused = dots.indexOf(document.activeElement as HTMLElement)
  const from = focused >= 0 ? focused : activeIndex.value
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const target =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? dots.length - 1
        : stepIndex(from, dots.length, forward ? 1 : -1)
  tabStop.value = target
  dots[target]?.focus()
  emit('update:modelValue', props.pages[target]!.id)
}
</script>

<style scoped>
.page-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.dot {
  width: 0.6rem;
  height: 0.6rem;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--primary);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease-out, transform 0.15s ease-out;
}
.dot.current {
  background: var(--primary);
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
