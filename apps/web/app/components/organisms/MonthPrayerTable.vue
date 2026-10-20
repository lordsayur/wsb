<template>
  <section class="month">
    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'unavailable'" class="state">{{ unavailableText }}</p>
    <template v-else>
      <p v-if="refreshing" class="state refreshing" role="status">
        <span class="spinner" aria-hidden="true" />
        {{ refreshingText }}
      </p>
      <p v-if="offlineText" class="state offline">{{ offlineText }}</p>
      <div class="table-wrap" tabindex="0" role="region" :aria-label="tableLabel">
        <table class="table">
          <caption class="visually-hidden">{{ tableLabel }}</caption>
          <thead>
            <tr>
              <th scope="col" class="date-col">{{ dateLabel }}</th>
              <th
                v-for="column in columns"
                :key="column.prayer"
                scope="col"
                class="prayer-col"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.date"
              :class="{ today: row.today, band: weekBand(row.date) }"
              :aria-current="row.today ? 'date' : undefined"
            >
              <th scope="row" class="date-col">
                <span class="day">{{ row.day }}</span>
                <span class="weekday">{{ row.weekday }}</span>
              </th>
              <td
                v-for="entry in row.entries"
                :key="entry.prayer"
                class="prayer-col"
                :class="{ current: entry.current }"
              >
                <TimeText :text="entry.time" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: one month of times, scrollable, prop-driven.
import TimeText from '../atoms/TimeText.vue'
import type { MonthDayRow } from '~/composables/usePrayerMonth'
import { weekBand } from '~/utils/monthBands'

withDefaults(
  defineProps<{
    state: 'loading' | 'ready' | 'unavailable'
    columns?: { prayer: string; label: string }[]
    rows?: MonthDayRow[]
    dateLabel?: string
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
    dateLabel: 'Date',
    tableLabel: 'Monthly prayer times',
    loadingText: 'Loading…',
    unavailableText: 'Prayer times are unavailable.',
    offlineText: '',
    refreshing: false,
    refreshingText: 'Updating…',
  },
)

</script>

<style scoped>
.month {
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
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.table th,
.table td {
  padding: 0.3rem 0.05rem;
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
.table tbody tr.band {
  background: color-mix(in srgb, var(--fg) 9%, transparent);
}
.table tbody tr.today {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.table td.current {
  font-weight: 700;
  color: var(--primary);
}
.date-col {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  width: 2.9rem;
  text-align: start;
  padding-inline-start: 0.4rem;
  background: var(--surface);
}
.table tbody tr.band .date-col {
  background: color-mix(in srgb, var(--fg) 9%, var(--surface));
}
.table tbody tr.today .date-col {
  background: color-mix(in srgb, var(--primary) 14%, var(--surface));
}
.table thead .date-col {
  background: var(--surface-2);
  z-index: 2;
}
.day {
  font-weight: 600;
}
.weekday {
  display: block;
  font-size: 0.65rem;
  opacity: 0.7;
}
.prayer-col {
  width: auto;
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
