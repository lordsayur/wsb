<template>
  <section class="prayer-list">
    <PrayerRow
      v-for="row in rows"
      :key="row.prayer"
      :label="row.label"
      :time="row.time || pendingTime"
      :current="row.current"
      :note="noteFor(row.prayer)"
      :note-soon="noteFor(row.prayer) !== '' && noteSoon"
      :class="{ pending: !row.time }"
    />
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: renders rows from core, no time math. The
// countdown sits under the next entry's row; while an entry has just passed,
// that note sits under the entry itself instead.
import { computed } from 'vue'
import PrayerRow from '../molecules/PrayerRow.vue'

export interface PrayerRowModel {
  prayer: string
  label: string
  time: string
  current?: boolean
  /** 1 for the next day's rows shown under the list. */
  dayOffset?: number
  /** Set for today's early rows moved to the bottom before Subuh. */
  trailing?: boolean
}

const props = withDefaults(
  defineProps<{
    rows?: PrayerRowModel[]
    /** The next entry's prayer name; it carries the countdown. */
    countdownKey?: string
    /** Countdown line for the next entry. */
    countdown?: string
    /** The entry that just passed, if its 20-minute window is open. */
    passedKey?: string
    /** Elapsed-duration note ("N m S s passed") for that entry. */
    passedNote?: string
    /** Turns the countdown primary when the next entry is close. */
    noteSoon?: boolean
    pendingTime?: string
  }>(),
  {
    rows: () => [],
    countdownKey: '',
    countdown: '',
    passedKey: '',
    passedNote: '',
    noteSoon: false,
    pendingTime: '--:--',
  },
)

// Next-day rows are keyed "imsak.next"; compare the domain name only.
const prayerOf = (key: string) => key.split('.')[0]

// While a just-passed note is showing it replaces the countdown, so the two
// never appear at once.
function noteFor(rowKey: string): string {
  if (props.passedNote && prayerOf(rowKey) === props.passedKey) {
    return props.passedNote
  }
  if (!props.passedNote && props.countdown && prayerOf(rowKey) === props.countdownKey) {
    return props.countdown
  }
  return ''
}
</script>

<style scoped>
.prayer-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 26rem;
  font-size: clamp(1.1rem, 3.6vh, 1.9rem);
}
.prayer-list :deep(.prayer-row) {
  flex: 1;
  padding-block: 0.15rem;
}
.prayer-list :deep(.prayer-row.pending .time-text) {
  opacity: 0.35;
}
</style>
