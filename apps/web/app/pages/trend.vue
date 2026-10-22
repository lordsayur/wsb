<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PrayerTrendChart from '~/components/organisms/PrayerTrendChart.vue'
import RangeSelector from '~/components/molecules/RangeSelector.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import { DEFAULT_DISTRICT } from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { usePrayerChart } from '~/composables/usePrayerChart'
import { useDistrict } from '~/composables/usePrayerTimes'
import { useSettings } from '~/composables/useSettings'
import { parseDate, parseDistrict, parseRange, queryValue } from '~/utils/query'

// specs/web/spec.md — the trend chart is its own page, loaded on first visit.
// The address carries the district, range and anchor so a link opens it.
const route = useRoute()
const router = useRouter()

const { t, locale } = useI18n()
const { timeFormat } = useSettings()

const { district } = useDistrict(parseDistrict(route.query.district))

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
  },
)

/** specs/web/spec.md — the address mirrors the district, range and anchor. */
function syncUrl() {
  if (!import.meta.client) return
  // Defaults stay out of the address, so "/trend" stays clean.
  const target: Record<string, string> = {}
  if (district.value !== DEFAULT_DISTRICT) target.district = district.value
  if (range.value !== 'month') target.range = range.value
  if (!isCurrent.value) target.date = anchor.value
  const current = route.query as Record<string, unknown>
  const keys = new Set([...Object.keys(target), ...Object.keys(current)])
  const same = [...keys].every(
    (key) => (target[key] ?? null) === queryValue(current[key]),
  )
  if (!same) void router.replace({ query: target })
}

watch([district, range, anchor], syncUrl)

/** A pasted or history-restored address restores the same range. */
watch(
  () => route.query,
  (query) => {
    const nextDistrict = parseDistrict(query.district)
    if (nextDistrict && nextDistrict !== district.value) {
      district.value = nextDistrict
    }
    const nextRange = parseRange(query.range)
    if (nextRange && nextRange !== range.value) range.value = nextRange
    const nextDate = parseDate(query.date)
    if (nextDate && nextDate !== anchor.value) anchor.value = nextDate
  },
)

/** The app page reads the same district, so carry it back. */
const backTo = computed(() =>
  district.value === DEFAULT_DISTRICT
    ? '/'
    : { path: '/', query: { district: district.value } },
)

useSeoMeta({
  title: () => t('page.trend'),
  description: () => t('chart.label'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <header class="head">
        <NuxtLink class="back" :to="backTo">
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          {{ t('trend.back') }}
        </NuxtLink>
        <h1 class="title">{{ t('page.trend') }}</h1>
      </header>

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
  overflow-y: auto;
}
.content {
  width: 100%;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
.title {
  margin: 0;
  font-size: 1.35rem;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.controls :deep(.range-selector) {
  flex: 1;
}
</style>
