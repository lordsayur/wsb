<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DISTRICTS,
  NOTIFICATION_LEAD_MINUTES,
  bruneiNow,
  durationParts,
  formatNumber,
  formatWeekday,
  monthOf,
} from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import PrayerTimeList from '~/components/organisms/PrayerTimeList.vue'
import MonthPrayerTable from '~/components/organisms/MonthPrayerTable.vue'
import PrayerTrendChart from '~/components/organisms/PrayerTrendChart.vue'
import AppFooter from '~/components/organisms/AppFooter.vue'
import DateDisplay from '~/components/molecules/DateDisplay.vue'
import PageIndicator from '~/components/molecules/PageIndicator.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import UpdatePrompt from '~/components/molecules/UpdatePrompt.vue'
import { usePrayerTimes } from '~/composables/usePrayerTimes'
import { usePrayerMonth } from '~/composables/usePrayerMonth'
import { usePrayerChart } from '~/composables/usePrayerChart'
import { useSwipe } from '~/composables/useSwipe'
import { usePrayerNotifications } from '~/composables/usePrayerNotifications'
import { usePwaUpdate } from '~/composables/usePwaUpdate'
import { usePullToRefresh } from '~/composables/usePullToRefresh'
import { useSettings } from '~/composables/useSettings'
import { useSharePrayerTimes } from '~/composables/useSharePrayerTimes'
import { useTheme } from '~/composables/useTheme'
import { PALETTES, type PaletteId, type ThemeMode } from '~/utils/theme'

// specs/web/spec.md — page wires the shell to core state. No logic here.
const { t, locale, locales, setLocale } = useI18n()

const {
  theme,
  setMode,
  setPalette,
  setCustom,
} = useTheme()

const { timeFormat, setTimeFormat } = useSettings()

const timeFormatOptions = computed(() => [
  { value: '24h' as const, label: t('settings.timeFormat.h24') },
  { value: '12h' as const, label: t('settings.timeFormat.h12') },
])

const themeModes = computed(() => [
  { value: 'dark' as ThemeMode, label: t('theme.dark') },
  { value: 'light' as ThemeMode, label: t('theme.light') },
])

const paletteOptions = computed(() => [
  ...PALETTES.map((palette) => ({
    id: palette.id as PaletteId,
    color: palette.color,
    label: t(`theme.palette.${palette.id}`),
  })),
])

const { needRefresh, reload, dismiss } = usePwaUpdate()

const {
  state,
  district,
  rows,
  date,
  dates,
  baseEntries,
  entries,
  progress,
  stale,
  refreshing: dayRefreshing,
  load,
  reloadData,
  selectDistrict,
} = usePrayerTimes(
  () => locale.value,
  () => timeFormat.value,
)

const PAGES = ['day', 'month', 'trend'] as const
type Page = (typeof PAGES)[number]

const view = ref<Page>('day')

const pageOptions = computed(() =>
  PAGES.map((page) => ({
    id: page,
    label: t(`page.${page}`),
  })),
)

function goToPage(delta: number) {
  const index = PAGES.indexOf(view.value)
  view.value = PAGES[(index + delta + PAGES.length) % PAGES.length]!
}

function selectPage(page: string) {
  if (PAGES.includes(page as Page)) view.value = page as Page
}

const {
  month,
  title: monthTitle,
  columns: monthColumns,
  rows: monthRows,
  state: monthState,
  stale: monthStale,
  refreshing: monthRefreshing,
  shift: shiftMonth,
  setMonth,
  reload: reloadMonth,
} = usePrayerMonth(
  () => district.value,
  () => locale.value,
  () => timeFormat.value,
  () => view.value === 'month',
)

const {
  range: chartRange,
  rangeOptions: chartRangeOptions,
  isCurrent: chartCurrent,
  prayerOptions: chartPrayerOptions,
  visiblePrayers,
  series: chartSeries,
  days: chartDays,
  axis: chartAxis,
  yTicks,
  xTicks,
  state: chartState,
  stale: chartStale,
  refreshing: chartRefreshing,
  hideOutliers,
  hasOutliers,
  outlierCount,
  setRange: setChartRange,
  shift: shiftChart,
  reset: resetChart,
  togglePrayer,
  toggleOutliers,
  reload: reloadChart,
} = usePrayerChart(
  () => district.value,
  () => locale.value,
  () => timeFormat.value,
  () => view.value === 'trend',
  t,
)

const currentMonth = computed(() => monthOf(bruneiNow().date))


const { offset: swipeOffset } = useSwipe({
  right: () => goToPage(-1),
  left: () => goToPage(1),
})

const { copied: shareCopied, share } = useSharePrayerTimes(
  () => baseEntries.value,
  () => date.value,
  () => dates.value.hijri,
  () => locale.value,
  () => timeFormat.value,
)

const { pull, refreshing, threshold } = usePullToRefresh(reloadApp)

const {
  supported: notificationsSupported,
  enabled: notificationsEnabled,
  label: notificationLabel,
  toggle: toggleNotifications,
} = usePrayerNotifications(
  () => entries.value,
  () => locale.value,
  t,
  () => timeFormat.value,
)

const districtOptions = computed(() =>
  DISTRICTS.map((value) => ({ value, label: t(`district.${value}`) })),
)

const languageOptions = computed(() =>
  locales.value.map((l) =>
    typeof l === 'string'
      ? { code: l, name: l }
      : { code: l.code, name: l.name ?? l.code },
  ),
)

const displayRows = computed(() =>
  rows.value.map((row) => ({
    prayer: row.prayer,
    label: t(`prayer.${row.prayer}`),
    time: row.time,
    current: row.current,
  })),
)

const weekday = computed(() => formatWeekday(date.value, locale.value))

const nextSoon = computed(
  () =>
    state.value === 'ready' &&
    progress.value.secondsToNext <= NOTIFICATION_LEAD_MINUTES * 60,
)

const nextText = computed(() => {
  if (state.value !== 'ready') return ''
  const total = progress.value.secondsToNext
  const { hours, minutes, seconds } = durationParts(total)
  const n = (value: number) => formatNumber(value, locale.value)
  const duration =
    total < 60
      ? t('duration.seconds', { seconds: n(seconds) })
      : hours > 0
        ? t('duration.hoursMinutes', {
            hours: n(hours),
            minutes: n(minutes),
          })
        : t('duration.minutes', { minutes: n(minutes) })
  return t('next.in', {
    duration,
    prayer: t(`prayer.${progress.value.next}`),
  })
})

function chooseLocale(code: string) {
  setLocale(code as typeof locale.value)
}

function reloadApp() {
  window.location.reload()
}

function reloadCurrent() {
  if (view.value === 'month') void reloadMonth()
  else if (view.value === 'trend') void reloadChart()
  else reloadData()
}

function openDownloads() {
  navigateTo('/download')
}

function openTasbih() {
  navigateTo('/tasbih')
}

onMounted(load)
</script>

<template>
  <div
    v-if="pull > 0 || refreshing"
    class="pull-indicator"
    :class="{ ready: pull >= threshold, refreshing }"
    :style="{ opacity: Math.min(1, pull / threshold), transform: `translateY(${Math.min(pull, threshold)}px)` }"
    role="status"
    aria-live="polite"
  >
    <span>{{ refreshing ? t('pull.refreshing') : t('pull.reload') }}</span>
  </div>

  <div
    class="layout"
    :class="`view-${view}`"
    :style="{
      transform: pull
        ? `translateY(${pull}px)`
        : swipeOffset
          ? `translateX(${swipeOffset}px)`
          : undefined,
    }"
  >
    <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>

    <PageIndicator
      :pages="pageOptions"
      :model-value="view"
      :label="t('page.label')"
      @update:model-value="selectPage"
    />

    <SourceNote
      :label="t('source.label')"
      :name="t('source.name')"
      :url="MORA_PAGE_URL"
    />

    <ClientOnly>
      <main id="main" class="main" :class="view" tabindex="-1">
        <template v-if="view === 'day'">
          <p class="weekday">{{ weekday }}</p>
          <DateDisplay :masihi="dates.masihi" :hijri="dates.hijri" />
          <p v-if="nextText" class="next" :class="{ soon: nextSoon }">
            {{ nextText }}
          </p>

          <PrayerTimeList
            :state="state"
            :rows="displayRows"
            :refreshing="dayRefreshing"
            :refreshing-text="t('state.refreshing')"
            :loading-text="t('state.loading')"
            :unavailable-text="t('state.unavailable')"
            :pending-time="t('state.pending')"
            :offline-text="stale ? t('state.offline') : ''"
          />
        </template>

        <PrayerTrendChart
          v-else-if="view === 'trend'"
          :state="chartState"
          :series="chartSeries"
          :days="chartDays"
          :axis="chartAxis"
          :y-ticks="yTicks"
          :x-ticks="xTicks"
          :prayer-options="chartPrayerOptions"
          :visible="visiblePrayers"
          :filter-label="t('chart.filter')"
          :chart-label="t('chart.label')"
          :date-label="t('month.date')"
          :refreshing="chartRefreshing"
          :refreshing-text="t('state.refreshing')"
          :loading-text="t('state.loading')"
          :unavailable-text="t('state.unavailable')"
          :offline-text="chartStale ? t('state.offline') : ''"
          :has-outliers="hasOutliers"
          :hide-outliers="hideOutliers"
          :outlier-count="outlierCount"
          :outlier-label="t('chart.hideOutliers')"
          @toggle-prayer="togglePrayer"
          @toggle-outliers="toggleOutliers"
        />

        <MonthPrayerTable
          v-else
          :state="monthState"
          :columns="monthColumns"
          :rows="monthRows"
          :date-label="t('month.date')"
          :table-label="t('month.tableLabel')"
          :refreshing="monthRefreshing"
          :refreshing-text="t('state.refreshing')"
          :loading-text="t('state.loading')"
          :unavailable-text="t('state.unavailable')"
          :offline-text="monthStale ? t('state.offline') : ''"
        />
      </main>
    </ClientOnly>

    <AppFooter
      :view="view"
      :range-label="t('chart.range.label')"
      :range="chartRange"
      :range-options="chartRangeOptions"
      :range-current="chartCurrent"
      :range-prev-label="t('chart.prev')"
      :range-next-label="t('chart.next')"
      :range-today-label="t('chart.today')"
      :month-label="t('month.label')"
      :month-title="monthTitle"
      :month-current="month === currentMonth"
      :month-prev-label="t('month.prev')"
      :month-next-label="t('month.next')"
      :month-today-label="t('month.today')"
      :district-label="t('district.label')"
      :district="district"
      :district-options="districtOptions"
      :menu-label="t('action.menu')"
      :settings-label="t('settings.title')"
      :back-label="t('settings.back')"
      :language-label="t('settings.language')"
      :locale="locale"
      :languages="languageOptions"
      :theme-mode-label="t('theme.mode')"
      :theme-mode="theme.mode"
      :theme-modes="themeModes"
      :theme-palette-label="t('theme.palette.label')"
      :palette="theme.palette"
      :palette-options="paletteOptions"
      :custom-color="theme.custom"
      :custom-color-label="t('theme.palette.custom')"
      :time-format-label="t('settings.timeFormat.label')"
      :time-format="timeFormat"
      :time-format-options="timeFormatOptions"
      :downloads-label="t('action.downloads')"
      :tasbih-label="t('action.tasbih')"
      :reload-data-label="t('action.reloadData')"
      :reload-app-label="t('action.reloadApp')"
      :share-label="t('action.share')"
      :share-formatted-label="t('share.formatted')"
      :share-raw-label="t('share.raw')"
      :share-copied-label="t('share.copied')"
      :share-copied="shareCopied"
      :notification-label="notificationLabel"
      :notifications-enabled="notificationsEnabled"
      :notifications-supported="notificationsSupported"
      @shift-month="shiftMonth"
      @update:range="setChartRange"
      @shift-chart="shiftChart"
      @today-chart="resetChart"
      @today-month="setMonth(currentMonth)"
      @update:district="selectDistrict"
      @share="share"
      @update:locale="chooseLocale"
      @update:theme-mode="setMode"
      @update:palette="setPalette"
      @update:custom-color="setCustom"
      @update:time-format="setTimeFormat"
      @downloads="openDownloads"
      @tasbih="openTasbih"
      @reload-data="reloadCurrent"
      @reload-app="reloadApp"
      @toggle-notifications="toggleNotifications"
    />

    <UpdatePrompt
      :show="needRefresh"
      :message="t('update.message')"
      :action-label="t('update.reload')"
      :dismiss-label="t('update.later')"
      @update="reload"
      @dismiss="dismiss"
    />
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  height: 100dvh;
  max-width: 32rem;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  transition: transform 0.15s ease-out;
}
.skip-link {
  position: absolute;
  inset-inline-start: 0.5rem;
  top: 0.5rem;
  z-index: 40;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  background: var(--primary);
  color: var(--primary-fg);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  translate: 0 -150%;
  transition: translate 0.15s ease-out;
}
.skip-link:focus-visible {
  translate: 0 0;
}
.main:focus {
  outline: none;
}
.pull-indicator {
  position: fixed;
  top: 0.35rem;
  left: 50%;
  z-index: 30;
  translate: -50% 0;
  display: flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  white-space: nowrap;
  background: var(--surface);
  color: var(--fg);
  border: 1px solid var(--primary);
  box-shadow: var(--shadow);
  pointer-events: none;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
.pull-indicator.ready {
  font-weight: 700;
}
.pull-indicator.refreshing {
  opacity: 1 !important;
}
.main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}
.main.month,
.main.trend {
  justify-content: flex-start;
  text-align: start;
}
@media (min-width: 768px) {
  .layout.view-month,
  .layout.view-trend {
    max-width: none;
  }
}
.weekday {
  margin: 0;
  font-size: clamp(1.15rem, 4vh, 1.5rem);
  font-weight: 700;
}
.next {
  margin: 0;
  font-weight: 600;
}
.next.soon {
  color: var(--primary);
}
@media (max-height: 480px) {
  .layout {
    padding: 0.5rem;
    gap: 0.35rem;
  }
  .main {
    gap: 0.25rem;
  }
  .weekday {
    font-size: 1.1rem;
  }
  .main :deep(.prayer-row) {
    padding-block: 0.2rem;
  }
}
</style>
