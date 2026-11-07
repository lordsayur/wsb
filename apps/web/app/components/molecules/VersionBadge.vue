<template>
  <span class="version-badge" :class="{ beta }">
    <span class="version" dir="ltr">{{ version }}</span>
    <span v-if="beta" class="tag">{{ betaLabel }}</span>
  </span>
</template>

<script setup lang="ts">
// specs/release/spec.md — molecule: the app version, marked while it is a beta.
withDefaults(
  defineProps<{
    version: string
    beta?: boolean
    betaLabel?: string
  }>(),
  { beta: false, betaLabel: 'beta' },
)
</script>

<style scoped>
.version-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-variant-numeric: tabular-nums;
}
.version {
  font-weight: 700;
  unicode-bidi: isolate;
}
.tag {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  border: 1px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 16%, transparent);
  color: var(--primary);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
