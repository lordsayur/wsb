<template>
  <div class="date-display">
    <time class="masihi" :datetime="isoDate">{{ masihi }}</time>
    <span class="separator" aria-hidden="true">·</span>
    <span class="hijri">{{ hijri }}</span>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: Masihi + Hijri, display-ready text only.
defineProps<{ masihi: string; hijri: string; isoDate?: string }>()
</script>

<style scoped>
.date-display {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
}
.masihi {
  font-weight: 600;
}
.hijri {
  opacity: 0.8;
}
</style>
