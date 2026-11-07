<template>
  <p class="basmalah" lang="ar" dir="rtl">
    <span class="text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
  </p>
</template>

<script setup lang="ts">
// specs/web/spec.md — atom: the basmalah. It is scripture, not interface copy,
// so the same Arabic text renders in every locale and is never translated.
</script>

<style scoped>
.basmalah {
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-family: 'Noto Naskh Arabic', system-ui, serif;
  line-height: 1.9;
}
.text {
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}
</style>
