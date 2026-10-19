<template>
  <span class="prayer-name">{{ label }}</span>
</template>

<script setup lang="ts">
// specs/web/spec.md — atom: pure, prop-driven.
defineProps<{ label: string }>()
</script>

<style scoped>
.prayer-name {
  font-weight: 600;
}
</style>
