<template>
  <nav class="page-tabs" :aria-label="label" @keydown="onKeydown">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      type="button"
      :class="{ active: tab.id === modelValue }"
      :aria-current="tab.id === modelValue ? 'page' : undefined"
      :aria-pressed="tab.id === modelValue"
      :tabindex="index === tabStop ? 0 : -1"
      @click="select(tab.id)"
      @focus="tabStop = index"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: header nav between the prayer-times pages.
// One tab stop; arrow keys move, Home/End jump, activation selects the page.
import { computed, ref, watch } from 'vue'
import { stepIndex } from '~/utils/rovingFocus'

export interface PageTab {
  id: string
  label: string
}

const props = defineProps<{
  label: string
  tabs: PageTab[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const tabStop = ref(0)

const activeIndex = computed(() =>
  Math.max(
    0,
    props.tabs.findIndex((tab) => tab.id === props.modelValue),
  ),
)

/** The selected tab is the group's single tab stop; follow it when it moves. */
watch(activeIndex, (index) => {
  tabStop.value = index
})

function select(id: string) {
  if (id !== props.modelValue) emit('update:modelValue', id)
}

function onKeydown(event: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const items = [
    ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button:not([disabled])',
    ),
  ]
  if (items.length === 0) return
  event.preventDefault()
  const focused = items.indexOf(document.activeElement as HTMLElement)
  const from = focused >= 0 ? focused : activeIndex.value
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const target =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : stepIndex(from, items.length, forward ? 1 : -1)
  tabStop.value = target
  items[target]?.focus()
  emit('update:modelValue', props.tabs[target]!.id)
}
</script>

<style scoped>
.page-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.2rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.page-tabs button {
  flex: 1;
  min-width: 0;
  height: calc(var(--control-h) - 0.4rem);
  font: inherit;
  font-size: 0.85rem;
  padding: 0 0.5rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.page-tabs button.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
</style>
