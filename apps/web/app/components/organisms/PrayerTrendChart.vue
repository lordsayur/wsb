<template>
  <section class="trend">
    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'unavailable'" class="state">{{ unavailableText }}</p>
    <template v-else>
      <p v-if="offlineText" class="state offline">{{ offlineText }}</p>

      <div class="legend" role="group" :aria-label="filterLabel">
        <button
          v-for="option in prayerOptions"
          :key="option.prayer"
          type="button"
          class="chip"
          :class="{ off: !visible.includes(option.prayer) }"
          :aria-pressed="visible.includes(option.prayer)"
          @click="emit('togglePrayer', option.prayer)"
        >
          <span
            class="swatch"
            :style="{ background: prayerColor(option.prayer) }"
            aria-hidden="true"
          />
          {{ option.label }}
        </button>
      </div>

      <div class="chart-wrap" dir="ltr">
        <div class="y-axis" aria-hidden="true">
          <span
            v-for="tick in yTicks"
            :key="tick.value"
            class="y-label"
            :style="{ top: `${percentY(tick.value)}%` }"
          >
            {{ tick.label }}
          </span>
        </div>

        <div class="plot">
          <svg
            class="chart"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            :aria-label="chartLabel"
          >
            <line
              v-for="tick in yTicks"
              :key="`y${tick.value}`"
              class="grid"
              x1="0"
              x2="100"
              :y1="percentY(tick.value)"
              :y2="percentY(tick.value)"
              vector-effect="non-scaling-stroke"
            />
            <line
              v-for="tick in xTicks"
              :key="`gx${tick.index}`"
              class="grid faint"
              :x1="percentX(tick.index)"
              :x2="percentX(tick.index)"
              y1="0"
              y2="100"
              vector-effect="non-scaling-stroke"
            />
            <path
              v-for="line in series"
              :key="line.prayer"
              :d="pathFor(line)"
              :stroke="prayerColor(line.prayer)"
              fill="none"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <template v-if="showPoints">
            <span
              v-for="point in points"
              :key="`${point.prayer}-${point.index}`"
              class="dot"
              :style="{
                left: `${percentX(point.index)}%`,
                top: `${percentY(point.value)}%`,
                background: prayerColor(point.prayer),
              }"
              :title="point.label"
            />
          </template>
        </div>

        <div class="x-axis" aria-hidden="true">
          <span
            v-for="(tick, position) in xTicks"
            :key="`x${tick.index}`"
            class="x-label"
            :class="{
              start: position === 0,
              end: position === xTicks.length - 1,
            }"
            :style="{ left: `${percentX(tick.index)}%` }"
          >
            {{ tick.label }}
          </span>
        </div>
      </div>

      <table class="visually-hidden">
        <caption>{{ chartLabel }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ dateLabel }}</th>
            <th v-for="line in series" :key="line.prayer" scope="col">
              {{ line.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(day, index) in days" :key="day.date">
            <th scope="row">{{ day.label }}</th>
            <td v-for="line in series" :key="line.prayer">
              {{ line.times[index] }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: line chart of prayer times over a date range.
import { computed } from 'vue'
import { prayerColor, scaleX, scaleY, seriesPath } from '~/utils/chart'
import type {
  ChartPrayerOption,
  ChartSeries,
} from '~/composables/usePrayerChart'
import type { PrayerName } from '@wsb/core'

interface ChartDay {
  date: string
  label: string
  entries: Partial<Record<PrayerName, number>>
}

const props = withDefaults(
  defineProps<{
    state: 'loading' | 'ready' | 'unavailable'
    series?: ChartSeries[]
    days?: ChartDay[]
    axis?: { min: number; max: number; step: number }
    yTicks?: { value: number; label: string }[]
    xTicks?: { index: number; label: string }[]
    prayerOptions?: ChartPrayerOption[]
    visible?: PrayerName[]
    filterLabel?: string
    chartLabel?: string
    dateLabel?: string
    loadingText?: string
    unavailableText?: string
    offlineText?: string
  }>(),
  {
    series: () => [],
    days: () => [],
    axis: () => ({ min: 0, max: 1440, step: 240 }),
    yTicks: () => [],
    xTicks: () => [],
    prayerOptions: () => [],
    visible: () => [],
    filterLabel: 'Entries',
    chartLabel: 'Prayer times',
    dateLabel: 'Date',
    loadingText: 'Loading…',
    unavailableText: 'Prayer times are unavailable.',
    offlineText: '',
  },
)

const emit = defineEmits<{ togglePrayer: [prayer: PrayerName] }>()

/** Percentage across the plot for a day index. */
function percentX(index: number): number {
  return scaleX(index, props.days.length, 100)
}

/** Percentage down the plot for a minute-of-day value. */
function percentY(value: number): number {
  return scaleY(value, props.axis.min, props.axis.max, 100)
}

function pathFor(line: ChartSeries): string {
  return seriesPath(
    line.values,
    props.days.length,
    100,
    100,
    props.axis.min,
    props.axis.max,
  )
}

/** Dense ranges read better without a marker per day. */
const showPoints = computed(() => props.days.length <= 14)

const points = computed(() =>
  props.series.flatMap((line) =>
    line.values.flatMap((value, index) =>
      value === null
        ? []
        : [
            {
              prayer: line.prayer,
              label: `${props.days[index]?.label ?? ''} — ${line.label} ${line.times[index]}`,
              index,
              value,
            },
          ],
    ),
  ),
)
</script>

<style scoped>
.trend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-height: 0;
  flex: 1;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.chip {
  font: inherit;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  cursor: pointer;
}
.chip[aria-pressed='true'] {
  border-color: var(--primary);
}
.chip.off {
  opacity: 0.45;
}
.swatch {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}
.chart-wrap {
  flex: 1;
  min-height: 10rem;
  display: grid;
  grid-template-columns: 3rem 1fr;
  grid-template-rows: 1fr 1.4rem;
  column-gap: 0.35rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.y-axis {
  grid-column: 1;
  grid-row: 1;
  position: relative;
  font-size: 0.65rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.y-label {
  position: absolute;
  inset-inline-end: 0;
  translate: 0 -50%;
  white-space: nowrap;
}
.plot {
  grid-column: 2;
  grid-row: 1;
  position: relative;
  min-width: 0;
}
.chart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.chart .grid {
  stroke: var(--border);
  stroke-width: 1;
}
.chart .grid.faint {
  opacity: 0.45;
}
.dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  translate: -50% -50%;
  pointer-events: none;
}
.x-axis {
  grid-column: 2;
  grid-row: 2;
  position: relative;
}
.x-label {
  position: absolute;
  bottom: 0;
  translate: -50% 0;
  font-size: 0.65rem;
  color: var(--muted);
  white-space: nowrap;
}
.x-label.start {
  translate: 0 0;
}
.x-label.end {
  translate: -100% 0;
}
.state {
  margin: 0.5rem 0;
}
.offline {
  font-size: 0.8rem;
  opacity: 0.75;
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
