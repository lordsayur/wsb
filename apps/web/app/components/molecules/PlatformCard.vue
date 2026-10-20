<template>
  <article class="platform-card" :class="{ soon: status === 'soon' }">
    <header class="head">
      <h2 class="name">{{ name }}</h2>
      <span class="status">{{ statusLabel }}</span>
    </header>
    <p class="description">{{ description }}</p>
    <a v-if="href" class="action" :href="href" rel="noopener">
      <Icon name="lucide:download" aria-hidden="true" />
      {{ actionLabel }}
    </a>
    <p v-else class="action disabled" aria-disabled="true">{{ actionLabel }}</p>
  </article>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: one platform on the downloads page.
withDefaults(
  defineProps<{
    name: string
    description: string
    status: 'available' | 'soon'
    statusLabel: string
    actionLabel: string
    href?: string
  }>(),
  { href: undefined },
)
</script>

<style scoped>
.platform-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.name {
  margin: 0;
  font-size: 1rem;
}
.status {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--primary);
  color: var(--primary);
  white-space: nowrap;
}
.description {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
}
.action {
  align-self: flex-start;
  font: inherit;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  text-decoration: none;
  background: var(--primary);
  color: var(--primary-fg);
}
.action.disabled {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  cursor: not-allowed;
}
.platform-card.soon {
  opacity: 0.75;
}
</style>
