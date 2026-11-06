<template>
  <article class="item" :class="{ unread }">
    <header class="head">
      <span class="kind" :class="kind">{{ kindLabel }}</span>
      <time v-if="date" class="date" :datetime="date">{{ dateLabel || date }}</time>
    </header>
    <h3 class="title">{{ title }}</h3>
    <p class="body">{{ body }}</p>
    <ul v-if="changes?.length" class="changes">
      <li v-for="change in changes" :key="change">{{ change }}</li>
    </ul>
    <NuxtLink v-if="link" class="link" :to="link">
      {{ linkLabel }}
      <Icon name="lucide:chevron-right" aria-hidden="true" />
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
// specs/notifications/spec.md — molecule: one notification row.
withDefaults(
  defineProps<{
    kind: 'version' | 'announcement'
    kindLabel: string
    title: string
    body: string
    date?: string
    dateLabel?: string
    changes?: string[]
    link?: string
    linkLabel?: string
    unread?: boolean
  }>(),
  { unread: false },
)
</script>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.item.unread {
  border-color: var(--primary);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.kind {
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  color: var(--muted);
}
.kind.version {
  border-color: var(--primary);
  color: var(--primary);
}
.date {
  font-size: 0.75rem;
  color: var(--muted);
}
.title {
  margin: 0;
  font-size: 1rem;
}
.body {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
  white-space: pre-line;
}
.changes {
  margin: 0;
  padding-inline-start: 1.1rem;
  font-size: 0.85rem;
  opacity: 0.85;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}
</style>
