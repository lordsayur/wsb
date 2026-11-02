<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MonthSelector from '~/components/molecules/MonthSelector.vue'
import MonthPrayerTable from '~/components/organisms/MonthPrayerTable.vue'
import PageTabs from '~/components/molecules/PageTabs.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import {
  DEFAULT_DISTRICT,
  bruneiNow,
  formatMonth,
  monthOf,
} from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { usePrayerMonth } from '~/composables/usePrayerMonth'
import { useDistrict } from '~/composables/usePrayerTimes'
import { useSettings } from '~/composables/useSettings'
import { parseDistrict, parseMonth, queryValue } from '~/utils/query'

// specs/web/spec.md — `/prayer-times`: one month of entries, one row per day.
// The graph lives on its own route so analytics sees the two views apart.
const route = useRoute()
const router = useRouter()

const { t, locale } = useI18n()
const { timeFormat } = useSettings()

const { district, selectDistrict } = useDistrict(
  parseDistrict(route.query.district),
)

const currentMonth = computed(() => monthOf(bruneiNow().date))

const {
  month,
  title: monthTitle,
  columns,
  rows,
  state,
  stale,
  refreshing,
  shift,
  setMonth,
} = usePrayerMonth(
  () => district.value,
  () => locale.value,
  () => timeFormat.value,
  () => true,
  parseMonth(route.query.month),
)

/** specs/web/spec.md — the address mirrors the district and month. */
function syncUrl() {
  if (!import.meta.client) return
  const target: Record<string, string> = {}
  if (district.value !== DEFAULT_DISTRICT) target.district = district.value
  if (month.value !== currentMonth.value) target.month = month.value
  const current = route.query as Record<string, unknown>
  const keys = new Set([...Object.keys(target), ...Object.keys(current)])
  const same = [...keys].every(
    (key) => (target[key] ?? null) === queryValue(current[key]),
  )
  if (!same) void router.replace({ query: target })
}

watch([district, month], syncUrl)

// A link may carry a stale month or a district the resolver rejects; tidy the
// address once the page is mounted.
onMounted(syncUrl)

/** A pasted or history-restored address restores the same selection. */
watch(
  () => route.query,
  (query) => {
    const nextMonth = parseMonth(query.month)
    if (nextMonth && nextMonth !== month.value) setMonth(nextMonth)
    const nextDistrict = parseDistrict(query.district)
    if (nextDistrict && nextDistrict !== district.value) {
      void selectDistrict(nextDistrict)
    }
  },
)

const backTo = computed(() =>
  district.value === DEFAULT_DISTRICT
    ? '/'
    : { path: '/', query: { district: district.value } },
)

const tabs = computed(() => [
  { id: 'table', label: t('prayerTimes.tabs.table') },
  { id: 'graph', label: t('prayerTimes.tabs.graph') },
])

function selectTab(id: string) {
  const path = id === 'graph' ? '/prayer-times/graph' : '/prayer-times'
  void router.push({
    path,
    query:
      district.value === DEFAULT_DISTRICT
        ? {}
        : { district: district.value },
  })
}

const tableLabel = computed(() =>
  t('prayerTimes.tableLabel', { month: formatMonth(month.value, locale.value) }),
)

useSeoMeta({
  title: () => t('prayerTimes.title'),
  description: () => t('prayerTimes.tableIntro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <header class="head">
        <NuxtLink class="back" :to="backTo">
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          {{ t('prayerTimes.back') }}
        </NuxtLink>
        <h1 class="title">{{ t('prayerTimes.title') }}</h1>
        <PageTabs
          :label="t('prayerTimes.tabs.label')"
          :tabs="tabs"
          model-value="table"
          @update:model-value="selectTab"
        />
      </header>

      <SourceNote
        :label="t('source.label')"
        :name="t('source.name')"
        :url="MORA_PAGE_URL"
      />

      <MonthPrayerTable
        :state="state"
        :columns="columns"
        :rows="rows"
        :date-label="t('month.date')"
        :table-label="tableLabel"
        :refreshing="refreshing"
        :refreshing-text="t('state.refreshing')"
        :loading-text="t('state.loading')"
        :unavailable-text="t('state.unavailable')"
        :offline-text="stale ? t('state.offline') : ''"
      />

      <footer class="controls">
        <MonthSelector
          :label="t('month.label')"
          :title="monthTitle"
          :current="month === currentMonth"
          :prev-label="t('month.prev')"
          :next-label="t('month.next')"
          :today-label="t('month.today')"
          @shift="shift"
          @today="setMonth(currentMonth)"
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
.controls :deep(.month-selector) {
  flex: 1;
}
@media (min-width: 768px) {
  .content {
    max-width: none;
  }
}
</style>
