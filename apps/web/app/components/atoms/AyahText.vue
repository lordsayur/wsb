<template>
  <p class="ayah-text" dir="rtl" :lang="lang" :aria-label="label">
    {{ text }}
  </p>
</template>

<script setup lang="ts">
// specs/quran/spec.md — atom: one Arabic ayah, right-to-left, never translated.
withDefaults(
  defineProps<{ text: string; label?: string; lang?: string }>(),
  { label: undefined, lang: 'ar' },
)
</script>

<style scoped>
.ayah-text {
  margin: 0;
  font-family: 'Noto Naskh Arabic', system-ui, sans-serif;
  font-size: clamp(1.5rem, 7vw, 2.1rem);
  line-height: 2.1;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>
