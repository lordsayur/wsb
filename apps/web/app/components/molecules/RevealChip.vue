<template>
  <button
    type="button"
    class="reveal-chip"
    :class="{ revealed }"
    :disabled="revealed || disabled"
    :aria-pressed="revealed"
    @click="emit('reveal')"
  >
    <Icon :name="icon" aria-hidden="true" />
    <span class="text">
      <template v-if="revealed">{{ value }}</template>
      <template v-else>{{ label }}</template>
    </span>
  </button>
</template>

<script setup lang="ts">
// specs/quran/spec.md — molecule: one reveal latch. It shows the button label
// until used, then the revealed value; once revealed it is inert.
withDefaults(
  defineProps<{
    label: string
    value: string
    icon: string
    revealed: boolean
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ reveal: [] }>()
</script>

<style scoped>
.reveal-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2rem;
  padding: 0 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}
.reveal-chip:disabled {
  cursor: default;
}
.reveal-chip.revealed {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
}
.reveal-chip.revealed:disabled {
  opacity: 1;
}
</style>
