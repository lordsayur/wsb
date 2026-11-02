<template>
  <section class="summary">
    <header class="hero">
      <p class="eyebrow">{{ weekday }}</p>
      <DateDisplay :masihi="dates.masihi" :hijri="dates.hijri" />
      <DayStatus :text="status" :busy="busy" />
    </header>

    <div class="next-card" :class="{ soon: nextSoon }">
      <p class="next-label">{{ nextLabel }}</p>
      <p class="next-name">{{ nextName }}</p>
      <p class="next-time">
        <TimeText :text="nextTime || pendingTime" />
        <span v-if="countdown" class="countdown">{{ countdown }}</span>
      </p>
      <div
        class="progress"
        role="progressbar"
        :aria-label="progressLabel"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="progressPercent"
      >
        <span class="fill" :style="{ inlineSize: `${progressPercent}%` }" />
      </div>
    </div>

    <ul class="grid" :aria-label="todayLabel">
      <li
        v-for="row in rows"
        :key="row.prayer"
        class="cell"
        :class="{ current: row.current }"
      >
        <span class="cell-label">{{ row.label }}</span>
        <TimeText class="cell-time" :text="row.time || pendingTime" />
      </li>
    </ul>

    <NuxtLink class="link" :to="allTimesTo">
      <Icon name="lucide:calendar-days" aria-hidden="true" />
      {{ allTimesLabel }}
      <Icon name="lucide:chevron-right" class="chevron" aria-hidden="true" />
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the summary slide. A hero for the next entry,
// a grid of today's entries, and a shortcut to every prayer time.
import DateDisplay from '../molecules/DateDisplay.vue'
import DayStatus from '../molecules/DayStatus.vue'
import TimeText from '../atoms/TimeText.vue'
import type { HomeRow } from '~/composables/useHomeDeck'

withDefaults(
  defineProps<{
    weekday: string
    dates: { masihi: string; hijri: string }
    status?: string
    busy?: boolean
    nextLabel: string
    nextName: string
    nextTime: string
    countdown?: string
    nextSoon?: boolean
    progressLabel: string
    progressPercent: number
    todayLabel: string
    /** Today's entries in prayer order. */
    rows?: HomeRow[]
    pendingTime?: string
    allTimesLabel: string
    allTimesTo: string | { path: string; query?: Record<string, string> }
  }>(),
  {
    status: '',
    busy: false,
    countdown: '',
    nextSoon: false,
    rows: () => [],
    pendingTime: '--:--',
  },
)
</script>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 26rem;
  margin: 0 auto;
  min-height: 0;
  flex: 1;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.eyebrow {
  margin: 0;
  font-size: clamp(1.05rem, 3.4vh, 1.4rem);
  font-weight: 700;
}
.next-card {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.next-card.soon {
  border-color: var(--primary);
}
.next-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.next-name {
  margin: 0;
  font-size: clamp(1.3rem, 4.2vh, 1.8rem);
  font-weight: 700;
}
.next-time {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: clamp(1.05rem, 3vh, 1.35rem);
  font-variant-numeric: tabular-nums;
}
.countdown {
  font-size: 0.72em;
  font-weight: 600;
  color: var(--muted);
}
.next-card.soon .countdown {
  color: var(--primary);
}
.progress {
  margin-top: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--fg) 12%, transparent);
  overflow: hidden;
}
.fill {
  display: block;
  block-size: 100%;
  border-radius: 999px;
  background: var(--primary);
  transition: inline-size 0.3s ease-out;
}
.grid {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  /* Cards stay compact; any spare height sits above the link at the bottom. */
  grid-auto-rows: minmax(2.8rem, 5rem);
  align-content: start;
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.35rem 0.55rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  min-inline-size: 0;
}
.cell.current {
  font-weight: 700;
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, var(--surface));
}
.cell-label {
  font-size: clamp(0.62rem, 1.5vh, 0.75rem);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--muted);
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-time {
  font-size: clamp(1.05rem, 3.1vh, 1.6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.cell.current .cell-label {
  color: var(--primary);
}
.link {
  margin-block-start: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-block-size: var(--control-h);
  padding: 0 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--fg);
}
.link:hover {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.chevron {
  opacity: 0.6;
}
@media (min-width: 480px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-height: 520px) {
  .summary {
    gap: 0.4rem;
  }
  .cell {
    padding-block: 0.2rem;
  }
}
</style>
