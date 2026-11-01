<template>
  <article
    class="prayer-row"
    :class="{ current }"
    :aria-current="current ? 'true' : undefined"
  >
    <div class="line">
      <PrayerNameLabel :label="label" />
      <span class="right">
        <span v-if="note" class="note" :class="{ soon: noteSoon }">{{
          note
        }}</span>
        <TimeText :text="time" />
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: composes atoms, prop-driven. The note sits
// beside the time: the countdown for the next entry, or how long ago this one
// passed.
import PrayerNameLabel from '../atoms/PrayerNameLabel.vue'
import TimeText from '../atoms/TimeText.vue'

withDefaults(
  defineProps<{
    label: string
    time: string
    current?: boolean
    /** Inline note beside the time. */
    note?: string
    /** Turns the note primary when the next entry is close. */
    noteSoon?: boolean
  }>(),
  { current: false, note: '', noteSoon: false },
)
</script>

<style scoped>
.prayer-row {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  border-bottom: 1px solid var(--border);
  text-align: start;
}
.line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  inline-size: 100%;
  min-inline-size: 0;
}
.right {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  min-inline-size: 0;
}
.note {
  color: var(--muted);
  font-size: 0.62em;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}
.note.soon {
  color: var(--primary);
}
.prayer-row.current {
  font-weight: 700;
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border-bottom-color: transparent;
  box-shadow: inset 3px 0 0 var(--primary);
}
:dir(rtl) .prayer-row.current {
  box-shadow: inset -3px 0 0 var(--primary);
}
@media (max-width: 26rem) {
  .note {
    white-space: normal;
    text-align: end;
  }
}
</style>
