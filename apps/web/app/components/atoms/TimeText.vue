<template>
  <time class="time-text" :datetime="datetime">{{ text }}</time>
</template>

<script setup lang="ts">
// specs/web/spec.md — atom: display-ready text, no formatting logic.
withDefaults(defineProps<{ text: string; datetime?: string }>(), {
  datetime: undefined,
})
</script>

<style scoped>
.time-text {
  font-variant-numeric: tabular-nums;
}
</style>
