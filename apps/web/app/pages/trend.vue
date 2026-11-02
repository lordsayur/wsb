<script setup lang="ts">
// specs/web/spec.md — the old `/trend` link lands on the graph tab.
definePageMeta({
  redirect: (to) => ({ path: '/prayer-times/graph', query: to.query }),
})
</script>

<template>
  <div />
</template>
