<script setup lang="ts">
// specs/web/spec.md — the auth gate shared by the admin pages. It renders only
// the state the `admin` function reported; it never decides access. The
// signed-in account and sign-out live in the admin shell, not here.
import type { AdminState } from '~/composables/useAdminAuth'

defineProps<{
  state: AdminState
  email: string
  loadingText: string
  signInHint: string
  signInLabel: string
  forbiddenText: string
  signOutLabel: string
}>()

const emit = defineEmits<{ signIn: []; signOut: [] }>()
</script>

<template>
  <p v-if="state === 'loading'" class="status">{{ loadingText }}</p>

  <section v-else-if="state === 'signed-out'" class="panel">
    <p>{{ signInHint }}</p>
    <button type="button" class="primary" @click="emit('signIn')">
      {{ signInLabel }}
    </button>
  </section>

  <section v-else-if="state === 'forbidden'" class="panel">
    <p>{{ forbiddenText }}</p>
    <p class="muted">{{ email }}</p>
    <button type="button" @click="emit('signOut')">{{ signOutLabel }}</button>
  </section>

  <slot v-else />
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
button {
  font: inherit;
  min-height: var(--control-h);
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--fg);
  cursor: pointer;
}
button.primary {
  background: var(--primary);
  color: var(--primary-fg);
  border-color: transparent;
  font-weight: 700;
}
.status,
.muted {
  margin: 0;
}
.muted {
  opacity: 0.7;
  font-size: 0.85rem;
}
</style>
