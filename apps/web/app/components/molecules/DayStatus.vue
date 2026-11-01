<template>
  <p v-if="text" class="status" role="status" aria-live="polite">
    <span v-if="busy" class="spinner" aria-hidden="true" />
    {{ text }}
  </p>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: one status line under the dates for the day's
// data state (loading, updating, offline, unavailable).
withDefaults(
  defineProps<{
    text?: string
    busy?: boolean
  }>(),
  { text: '', busy: false },
)
</script>

<style scoped>
.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0 0 0.35rem;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.2;
}
.spinner {
  flex: 0 0 auto;
  inline-size: 0.7rem;
  block-size: 0.7rem;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-block-start-color: var(--primary);
  animation: spin 0.8s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
