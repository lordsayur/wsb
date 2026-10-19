<template>
  <p class="source-note">
    <span>{{ label }}:</span>
    <a :href="url" target="_blank" rel="noopener noreferrer">{{ name }}</a>
  </p>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: small, muted data-source attribution.
defineProps<{ label: string; name: string; url: string }>()
</script>

<style scoped>
.source-note {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  opacity: 0.55;
}
</style>
