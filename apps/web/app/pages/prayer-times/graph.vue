<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PrayerTrendChart from '~/components/organisms/PrayerTrendChart.vue'
import RangeSelector from '~/components/molecules/RangeSelector.vue'
import PageTabs from '~/components/molecules/PageTabs.vue'
import PageHeader from '~/components/organisms/PageHeader.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import { DEFAULT_DISTRICT, type ChartRange } from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { usePrayerChart } from '~/composables/usePrayerChart'
import { useDistrict } from '~/composables/usePrayerTimes'
import { useSettings } from '~/composables/useSettings'
import { parseDate, parseDistrict, parseRange, queryValue } from '~/utils/query'

// specs/web/spec.md — `/prayer-times/graph`: the trend chart, its own route and
// its own analytics pageview. Month and year only, defaulting to the year.
const GRAPH_RANGES: readonly ChartRange[] = ['month', 'year']

const route = useRoute()
const router = useRouter()

const { t, locale } = useI18n()
const { timeFormat } = useSettings()

const { district, selectDistrict } = useDistrict(
  parseDistrict(route.query.district),
)

const {
  range,
  anchor,
  periodLabel,
  rangeOptions,
  isCurrent,
  prayerOptions,
  visiblePrayers,
  series,
  days,
  axis,
  yTicks,
  xTicks,
  state,
  stale,
  refreshing,
  hideOutliers,
  hasOutliers,
  outlierCount,
  setRange,
  shift,
  reset,
  togglePrayer,
  toggleOutliers,
} = usePrayerChart(
  () => district.value,
  () => locale.value,
  () => timeFormat.value,
  () => true,
  t,
  {
    range: parseRange(route.query.range),
    anchor: parseDate(route.query.date),
    ranges: GRAPH_RANGES,
    defaultRange: 'year',
  },
)

/** specs/web/spec.md — the address mirrors the district, range and anchor. */
function syncUrl() {
  if (!import.meta.client) return
  // Defaults stay out of the address, so the graph route stays clean.
  const target: Record<string, string> = {}
  if (district.value !== DEFAULT_DISTRICT) target.district = district.value
  if (range.value !== 'year') target.range = range.value
  if (!isCurrent.value) target.date = anchor.value
  const current = route.query as Record<string, unknown>
  const keys = new Set([...Object.keys(target), ...Object.keys(current)])
  const same = [...keys].every(
    (key) => (target[key] ?? null) === queryValue(current[key]),
  )
  if (!same) void router.replace({ query: target })
}

watch([district, range, anchor], syncUrl)

// A link may carry a value this page no longer offers (an old week range, a
// stale anchor); tidy the address once the page is mounted.
onMounted(syncUrl)

/** A pasted or history-restored address restores the same range. */
watch(
  () => route.query,
  (query) => {
    const nextDistrict = parseDistrict(query.district)
    if (nextDistrict && nextDistrict !== district.value) {
      void selectDistrict(nextDistrict)
    }
    const nextRange = parseRange(query.range)
    if (nextRange && GRAPH_RANGES.includes(nextRange) && nextRange !== range.value) {
      range.value = nextRange
    }
    const nextDate = parseDate(query.date)
    if (nextDate && nextDate !== anchor.value) anchor.value = nextDate
  },
)

const tabs = computed(() => [
  { id: 'table', label: t('prayerTimes.tabs.table') },
  { id: 'graph', label: t('prayerTimes.tabs.graph') },
])

function selectTab(id: string) {
  if (id === 'graph') return
  void router.push({
    path: '/prayer-times',
    query:
      district.value === DEFAULT_DISTRICT
        ? {}
        : { district: district.value },
  })
}

useSeoMeta({
  title: () => t('prayerTimes.graphTitle'),
  description: () => t('chart.label'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <PageHeader
        :title="t('prayerTimes.title')"
      >
        <PageTabs
          :label="t('prayerTimes.tabs.label')"
          :tabs="tabs"
          model-value="graph"
          @update:model-value="selectTab"
        />
      </PageHeader>

      <SourceNote
        :label="t('source.label')"
        :name="t('source.name')"
        :url="MORA_PAGE_URL"
      />

      <PrayerTrendChart
        :state="state"
        :series="series"
        :days="days"
        :axis="axis"
        :y-ticks="yTicks"
        :x-ticks="xTicks"
        :prayer-options="prayerOptions"
        :visible="visiblePrayers"
        :filter-label="t('chart.filter')"
        :chart-label="t('chart.label')"
        :period="periodLabel"
        :date-label="t('month.date')"
        :refreshing="refreshing"
        :refreshing-text="t('state.refreshing')"
        :loading-text="t('state.loading')"
        :unavailable-text="t('state.unavailable')"
        :offline-text="stale ? t('state.offline') : ''"
        :has-outliers="hasOutliers"
        :hide-outliers="hideOutliers"
        :outlier-count="outlierCount"
        :outlier-label="t('chart.hideOutliers')"
        @toggle-prayer="togglePrayer"
        @toggle-outliers="toggleOutliers"
      />

      <footer class="controls">
        <RangeSelector
          :label="t('chart.range.label')"
          :value="range"
          :options="rangeOptions"
          :current="isCurrent"
          :prev-label="t('chart.prev')"
          :next-label="t('chart.next')"
          :today-label="t('chart.today')"
          @update:range="setRange"
          @shift="shift"
          @today="reset"
        />
      </footer>
    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}
.content {
  width: 100%;
  max-width: 64rem;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.controls :deep(.range-selector) {
  flex: 1;
}
@media (min-width: 768px) {
  .content {
    max-width: none;
  }
}
</style>
