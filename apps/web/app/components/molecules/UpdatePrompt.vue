<template>
  <aside v-if="show" class="update-prompt" role="status" aria-live="polite">
    <span class="message">{{ message }}</span>
    <button type="button" class="action" @click="emit('update')">
      {{ actionLabel }}
    </button>
    <button type="button" class="dismiss" @click="emit('dismiss')">
      {{ dismissLabel }}
    </button>
  </aside>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: PWA update banner, prop-driven, no platform glue.
withDefaults(
  defineProps<{
    show?: boolean
    message?: string
    actionLabel?: string
    dismissLabel?: string
  }>(),
  {
    show: false,
    message: 'A new version is available.',
    actionLabel: 'Reload',
    dismissLabel: 'Later',
  },
)

const emit = defineEmits<{ update: []; dismiss: [] }>()
</script>

<style scoped>
.update-prompt {
  position: fixed;
  inset-inline: 1rem;
  bottom: 1rem;
  z-index: 50;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--fg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.message {
  flex: 1 1 12rem;
}
.action,
.dismiss {
  font: inherit;
  padding: 0.4rem 0.8rem;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.action {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
.dismiss {
  background: transparent;
  color: inherit;
  opacity: 0.8;
}
</style>
