<template>
  <section class="week">
    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'unavailable'" class="state">{{ unavailableText }}</p>
    <template v-else>
      <p v-if="refreshing" class="state refreshing" role="status">
        <span class="spinner" aria-hidden="true" />
        {{ refreshingText }}
      </p>
      <p v-if="offlineText" class="state offline">{{ offlineText }}</p>

      <div
        class="table-wrap"
        tabindex="0"
        role="region"
        :aria-label="tableLabel"
      >
        <table class="table">
          <caption class="visually-hidden">{{ tableLabel }}</caption>
          <thead>
            <tr>
              <th scope="col" class="entry-col">{{ entryLabel }}</th>
              <th
                v-for="column in columns"
                :key="column.date"
                scope="col"
                class="day-col"
                :class="{ today: column.today }"
              >
                <span class="weekday">{{ column.weekday }}</span>
                <span class="day">{{ column.day }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.prayer">
              <th scope="row" class="entry-col">{{ row.label }}</th>
              <td
                v-for="(cell, index) in row.cells"
                :key="index"
                class="day-col"
                :class="{ current: cell.current, today: columns[index]?.today }"
              >
                <TimeText :text="cell.text" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: one week transposed, prayers down and days
// across, so a whole week reads without sideways scrolling.
import TimeText from '../atoms/TimeText.vue'
import type { WeekColumn, WeekRow } from '~/composables/usePrayerWeek'

withDefaults(
  defineProps<{
    state: 'loading' | 'ready' | 'unavailable'
    columns?: WeekColumn[]
    rows?: WeekRow[]
    entryLabel?: string
    tableLabel?: string
    loadingText?: string
    unavailableText?: string
    offlineText?: string
    refreshing?: boolean
    refreshingText?: string
  }>(),
  {
    columns: () => [],
    rows: () => [],
    entryLabel: 'Entry',
    tableLabel: 'Weekly prayer times',
    loadingText: 'Loading…',
    unavailableText: 'Prayer times are unavailable.',
    offlineText: '',
    refreshing: false,
    refreshingText: 'Updating…',
  },
)
</script>

<style scoped>
.week {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-height: 0;
  flex: 1;
}
.refreshing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  opacity: 0.65;
}
.spinner {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  -webkit-overflow-scrolling: touch;
}
.table {
  width: 100%;
  height: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  /* Times must stay whole on the narrowest phone; the row header shrinks
     first. */
  font-size: clamp(0.58rem, 2.7vw, 0.74rem);
  font-variant-numeric: tabular-nums;
}
.table th,
.table td {
  padding: 0.3rem 0.02rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid var(--border);
}
.table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface-2);
  font-weight: 600;
}
.table td.current {
  font-weight: 700;
  color: var(--primary);
}
.day-col.today {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.entry-col {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  width: clamp(3.5rem, 21vw, 5.1rem);
  text-align: start;
  padding-inline-start: 0.4rem;
  background: var(--surface);
  font-weight: 600;
  font-size: 0.92em;
}
.table thead .entry-col {
  background: var(--surface-2);
  z-index: 2;
}
.weekday {
  display: block;
  font-size: 0.62rem;
  opacity: 0.7;
}
.day {
  display: block;
  font-weight: 600;
}
.state {
  margin: 0.5rem 0;
}
.offline {
  font-size: 0.8rem;
  opacity: 0.75;
}
.table-wrap:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
