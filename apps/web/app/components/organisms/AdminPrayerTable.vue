<script setup lang="ts">
// specs/web/spec.md — admin prayer table: one row per day, one editable cell
// per stored entry. Cells stage edits; the page saves them all at once. Only
// the base times are stored; districts stay in core.
import { adminEditKey, type AdminDay, type StoredPrayer } from '@wsb/data/admin'

const props = defineProps<{
  days: AdminDay[]
  busy: boolean
  edits: Record<string, string>
  dateLabel: string
  hijriLabel: string
  emptyText: string
  prayers: readonly StoredPrayer[]
  prayerLabels: Record<StoredPrayer, string>
}>()

const emit = defineEmits<{
  edit: [value: { prayerDate: string; prayer: StoredPrayer; time: string }]
}>()

function time(value: string | null) {
  return value?.slice(0, 5) ?? ''
}

function dirty(day: AdminDay, prayer: StoredPrayer) {
  return adminEditKey(day.prayerDate, prayer) in props.edits
}

function edit(day: AdminDay, prayer: StoredPrayer, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  emit('edit', {
    prayerDate: day.prayerDate,
    prayer,
    time: raw ? `${raw}:00` : '',
  })
}
</script>

<template>
  <div class="wrap">
    <p v-if="days.length === 0" class="muted">{{ emptyText }}</p>
    <table v-else class="records">
      <thead>
        <tr>
          <th scope="col">{{ dateLabel }}</th>
          <th scope="col">{{ hijriLabel }}</th>
          <th v-for="prayer in prayers" :key="prayer" scope="col">
            {{ prayerLabels[prayer] }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in days" :key="day.prayerDate">
          <th scope="row">{{ day.prayerDate }}</th>
          <td class="hijri">{{ day.hijriDate }}</td>
          <td v-for="prayer in prayers" :key="prayer">
            <input
              type="time"
              :class="{ dirty: dirty(day, prayer) }"
              :aria-label="`${day.prayerDate} ${prayerLabels[prayer]}`"
              :value="time(day.times[prayer])"
              :disabled="busy"
              @change="edit(day, prayer, $event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.records {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.records th,
.records td {
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid var(--border);
  text-align: start;
  white-space: nowrap;
}
.records thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
}
.records tbody th {
  font-weight: 600;
}
.records input {
  font: inherit;
  min-height: 2rem;
  width: 6.5rem;
  padding: 0 0.35rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--fg);
}
.records input:disabled {
  opacity: 0.5;
}
.records input.dirty {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary) inset;
}
.hijri {
  opacity: 0.75;
}
.muted {
  margin: 0;
  opacity: 0.7;
  font-size: 0.85rem;
}
.wrap {
  overflow-x: auto;
}
</style>
