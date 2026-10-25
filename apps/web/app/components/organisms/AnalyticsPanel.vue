<template>
  <section class="analytics">
    <header class="head">
      <h2 class="subtitle">{{ title }}</h2>
      <div class="controls">
        <div
          class="ranges"
          role="group"
          :aria-label="rangeLabel"
          @keydown="onGroupKeydown"
        >
          <button
            v-for="option in ranges"
            :key="option.value"
            type="button"
            :aria-pressed="option.value === days"
            :class="{ active: option.value === days }"
            @click="emit('update:days', option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <label class="other">
          <input
            type="checkbox"
            :checked="includeOther"
            :disabled="busy"
            @change="
              emit(
                'update:includeOther',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          {{ includeOtherLabel }}
        </label>
      </div>
    </header>

    <p v-if="state === 'loading'" class="state">{{ loadingText }}</p>
    <p v-else-if="state === 'error'" class="state error" role="status">
      {{ errorText }}
    </p>

    <template v-else-if="stats">
      <div class="kpis">
        <div class="kpi">
          <span class="kpi-label">{{ viewsLabel }}</span>
          <strong class="kpi-value">{{ stats.totals.views }}</strong>
          <span class="kpi-change" :class="changeClass(viewsChange)">
            {{ changeText(viewsChange) }}
          </span>
        </div>
        <div class="kpi">
          <span class="kpi-label">{{ sessionsLabel }}</span>
          <strong class="kpi-value">{{ stats.totals.sessions }}</strong>
          <span class="kpi-change" :class="changeClass(sessionsChange)">
            {{ changeText(sessionsChange) }}
          </span>
        </div>
      </div>

      <p v-if="stats.totals.views === 0" class="state muted">
        {{ emptyText }}
      </p>

      <template v-else>
        <div class="panel">
          <h3 class="label">{{ dailyLabel }}</h3>
          <div
            class="bars"
            role="img"
            :aria-label="dailyLabel"
            dir="ltr"
          >
            <span
              v-for="(bar, index) in heights"
              :key="index"
              class="bar"
              :style="{ height: `${bar}%` }"
              :title="`${stats.days[index]?.day}: ${stats.days[index]?.views}`"
            />
          </div>
        </div>

        <div class="grid">
          <div class="panel">
            <h3 class="label">{{ topPagesLabel }}</h3>
            <ul class="rows">
              <li v-for="row in stats.topPaths" :key="row.path">
                <code>{{ row.path }}</code>
                <span>{{ row.views }}</span>
              </li>
            </ul>
          </div>

          <div class="panel">
            <h3 class="label">{{ eventsLabel }}</h3>
            <ul class="rows">
              <li v-for="row in stats.events" :key="row.event">
                <span>{{ eventName(row.event) }}</span>
                <span>{{ row.views }}</span>
              </li>
            </ul>
          </div>

          <div class="panel">
            <h3 class="label">{{ localesLabel }}</h3>
            <ul class="rows">
              <li v-for="row in stats.locales" :key="row.locale">
                <span>{{ row.locale }}</span>
                <span>{{ row.views }}</span>
              </li>
            </ul>
          </div>

          <div class="panel">
            <h3 class="label">{{ devicesLabel }}</h3>
            <ul class="rows">
              <li v-for="row in stats.devices" :key="row.device">
                <span>{{ deviceName(row.device) }}</span>
                <span>{{ row.views }}</span>
              </li>
            </ul>
          </div>

          <div class="panel wide">
            <h3 class="label">{{ referrersLabel }}</h3>
            <ul class="rows">
              <li v-for="(row, index) in stats.referrers" :key="index">
                <span>{{ row.referrerHost || directLabel }}</span>
                <span>{{ row.views }}</span>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the admin analytics panel. Prop-driven so the
// stories run without the Nuxt runtime or Supabase.
import { computed } from 'vue'
import { onGroupKeydown } from '~/utils/rovingFocus'
import { barHeights, changePercent } from '~/utils/analytics'
import type {
  AnalyticsRange,
  AnalyticsStats,
} from '~/composables/useAnalytics'

const props = withDefaults(
  defineProps<{
    title: string
    state: 'idle' | 'loading' | 'ready' | 'error'
    stats: AnalyticsStats | null
    days: AnalyticsRange
    includeOther?: boolean
    ranges?: { value: AnalyticsRange; label: string }[]
    rangeLabel?: string
    includeOtherLabel?: string
    viewsLabel?: string
    sessionsLabel?: string
    dailyLabel?: string
    topPagesLabel?: string
    eventsLabel?: string
    localesLabel?: string
    devicesLabel?: string
    referrersLabel?: string
    directLabel?: string
    loadingText?: string
    emptyText?: string
    errorText?: string
    deviceLabels?: Record<string, string>
    eventLabels?: Record<string, string>
    busy?: boolean
  }>(),
  {
    includeOther: false,
    ranges: () => [
      { value: 7, label: '7' },
      { value: 30, label: '30' },
      { value: 90, label: '90' },
    ],
    rangeLabel: 'Period',
    includeOtherLabel: 'Include preview and development',
    viewsLabel: 'Views',
    sessionsLabel: 'Sessions',
    dailyLabel: 'Daily views',
    topPagesLabel: 'Top pages',
    eventsLabel: 'Events',
    localesLabel: 'Languages',
    devicesLabel: 'Devices',
    referrersLabel: 'Referrers',
    directLabel: 'Direct',
    loadingText: 'Loading…',
    emptyText: 'No visits recorded for this period.',
    errorText: 'Analytics could not be loaded.',
    deviceLabels: () => ({}),
    eventLabels: () => ({}),
    busy: false,
  },
)

const emit = defineEmits<{
  'update:days': [value: AnalyticsRange]
  'update:includeOther': [value: boolean]
}>()

const heights = computed(() => barHeights(props.stats?.days ?? []))
const viewsChange = computed(() =>
  changePercent(
    props.stats?.totals.views ?? 0,
    props.stats?.previous.views ?? 0,
  ),
)
const sessionsChange = computed(() =>
  changePercent(
    props.stats?.totals.sessions ?? 0,
    props.stats?.previous.sessions ?? 0,
  ),
)

function changeClass(value: number | null): string {
  if (value === null || value === 0) return 'flat'
  return value > 0 ? 'up' : 'down'
}

function changeText(value: number | null): string {
  if (value === null) return '—'
  return `${value > 0 ? '+' : ''}${value}%`
}

function deviceName(value: string | undefined): string {
  return (value && props.deviceLabels[value]) || value || ''
}

function eventName(value: string | undefined): string {
  return (value && props.eventLabels[value]) || value || ''
}
</script>

<style scoped>
.analytics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.subtitle {
  margin: 0;
  font-size: 1rem;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.ranges {
  display: flex;
  height: var(--control-h);
  padding: 0.2rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.ranges button {
  font: inherit;
  font-size: 0.78rem;
  min-width: 2.4rem;
  padding: 0 0.4rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
}
.ranges button.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
.other {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.75rem;
}
.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.kpi-label {
  font-size: 0.75rem;
  opacity: 0.7;
}
.kpi-value {
  font-size: 1.6rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.kpi-change {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.kpi-change.up {
  color: #4ade80;
}
.kpi-change.down {
  color: #f87171;
}
.kpi-change.flat {
  opacity: 0.6;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.75rem;
}
.grid .wide {
  grid-column: 1 / -1;
}
.label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 6rem;
  padding-top: 0.25rem;
}
.bar {
  flex: 1;
  min-width: 1px;
  min-height: 1px;
  border-radius: 2px 2px 0 0;
  background: var(--primary);
  opacity: 0.8;
}
.rows {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;
}
.rows li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.rows code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rows span:last-child {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.state {
  margin: 0;
  font-size: 0.85rem;
}
.state.error {
  color: #f87171;
}
.state.muted {
  opacity: 0.7;
}
</style>
