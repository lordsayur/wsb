<template>
  <header class="page-header">
    <div class="bar">
      <PageMenu class="menu" />

      <div class="basmalah">
        <BasmalahText />
      </div>

      <div class="actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="head">
      <h1 class="title">{{ title }}</h1>
      <slot name="badge" />
    </div>

    <p v-if="intro" class="intro">{{ intro }}</p>

    <div v-if="$slots.default" class="extra">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: every page outside the home deck shares one
// header. The nav row holds the menu (settings plus every destination) and the
// basmalah; below it come the page title, an optional intro and an optional row
// of tabs. Flat: one bottom rule, no card and no pill.
import BasmalahText from '../atoms/BasmalahText.vue'
import PageMenu from './PageMenu.vue'

defineProps<{
  title: string
  intro?: string
}>()
</script>

<style scoped>
.page-header {
  position: sticky;
  top: 0;
  z-index: 5;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0 0.8rem;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border-bottom: 1px solid var(--border);
}

/* The nav row: three equal tracks, so the basmalah is always dead centre no
   matter which side the menu takes. */
.bar {
  /* Stretch to the header even inside a centred flex column, so the menu
     always lands on the real edge rather than at the end of a shrunk row. */
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
}

.menu {
  grid-row: 1;
  grid-column: var(--menu-col);
  justify-self: var(--menu-justify);
}

.basmalah {
  grid-row: 1;
  grid-column: 2;
  font-size: 0.95rem;
  opacity: 0.85;
  text-align: center;
  white-space: nowrap;
}

.actions {
  grid-row: 1;
  grid-column: var(--actions-col);
  justify-self: var(--actions-justify);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.6rem;
}
.title {
  margin: 0;
  font-size: clamp(1.3rem, 1rem + 1.2vw, 1.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.intro {
  margin: 0;
  max-width: 60ch;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.extra {
  padding-top: 0.5rem;
}

/* On a narrow screen the nav stacks so neither item has to shrink. */
@media (max-width: 340px) {
  .bar {
    grid-template-columns: auto 1fr auto;
    row-gap: 0.15rem;
  }
  .basmalah {
    white-space: normal;
    text-align: center;
  }
}
</style>
