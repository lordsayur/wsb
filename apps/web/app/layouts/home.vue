<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DEFAULT_DISTRICT,
  DISTRICTS,
  NEXT_SOON_MINUTES,
  PRAYER_ORDER,
  durationParts,
  formatNumber,
  formatTime,
  formatWeekday,
} from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import AppFooter from '~/components/organisms/AppFooter.vue'
import PageIndicator from '~/components/molecules/PageIndicator.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import UpdatePrompt from '~/components/molecules/UpdatePrompt.vue'
import { provideHomeDeck, type HomeRow } from '~/composables/useHomeDeck'
import { usePrayerNotifications } from '~/composables/usePrayerNotifications'
import { usePrayerTimes } from '~/composables/usePrayerTimes'
import { usePwaUpdate } from '~/composables/usePwaUpdate'
import { usePullToRefresh } from '~/composables/usePullToRefresh'
import { useSettings } from '~/composables/useSettings'
import { useSharePrayerTimes } from '~/composables/useSharePrayerTimes'
import { useSwipe } from '~/composables/useSwipe'
import { useTheme } from '~/composables/useTheme'
import { stepHomeSlide, HOME_SLIDE_COOKIE, homeSlideFromPath, homeSlidePath } from '~/utils/homeSlides'
import { segmentProgress } from '~/utils/progress'
import { parseDistrict, prayerTimesLink, queryValue } from '~/utils/query'
import { PALETTES, type PaletteId, type ThemeMode } from '~/utils/theme'

// specs/web/spec.md — the home deck: one layout owns the day's data, the
// footer and the swipe, and three separate routes render its slides. Because
// each slide is a route, analytics counts them apart; the address mirrors the
// slide and the last one is remembered in a cookie.
const route = useRoute()
const router = useRouter()
const { t, locale, locales, setLocale } = useI18n()

const { theme, setMode, setPalette, setCustom } = useTheme()
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
  entries,
  baseEntries,
  progress,
  passed,
  stale,
  refreshing: dayRefreshing,
  load,
  reloadData,
  selectDistrict,
} = usePrayerTimes(
  () => locale.value,
  () => timeFormat.value,
  parseDistrict(route.query.district),
)

/** specs/web/spec.md — the address mirrors the selected district. */
function syncUrl() {
  if (!import.meta.client) return
  // Defaults stay out of the address; a non-default district rides along.
  const next = district.value === DEFAULT_DISTRICT ? null : district.value
  if (next !== queryValue(route.query.district)) {
    const query = { ...route.query }
    if (next) query.district = next
    else delete query.district
    void router.replace({ query })
  }
}

watch(district, syncUrl)

watch(
  () => route.query.district,
  (value) => {
    const nextDistrict = parseDistrict(value)
    if (nextDistrict && nextDistrict !== district.value) {
      void selectDistrict(nextDistrict)
    }
  },
)

const slide = computed(() => homeSlideFromPath(route.path))

/** Remembers the slide the reader was last on, so `/` reopens it. */
const lastSlide = useCookie<string | null>(HOME_SLIDE_COOKIE, {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

watch(
  slide,
  (value) => {
    if (import.meta.client) lastSlide.value = value
  },
  { immediate: true },
)

function goSlide(delta: number) {
  const next = stepHomeSlide(slide.value, delta)
  if (next === slide.value) return
  void router.replace({ path: homeSlidePath(next), query: route.query })
}

function goToSlide(id: string) {
  const next = stepHomeSlide(id, 0)
  if (next === slide.value) return
  void router.replace({ path: homeSlidePath(next), query: route.query })
}

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

const displayRows = computed<HomeRow[]>(() =>
  rows.value.map((row) => ({
    prayer: row.prayer,
    label: t(`prayer.${row.prayer}`),
    time: row.time,
    current: row.current,
  })),
)

/** Today's entries in prayer order, for the summary grid. */
const summaryRows = computed<HomeRow[]>(() =>
  PRAYER_ORDER.map((prayer) => {
    const entry = entries.value.find((item) => item.prayer === prayer)
    return {
      prayer,
      label: t(`prayer.${prayer}`),
      time: entry ? formatTime(entry.minutes, locale.value, timeFormat.value) : '',
      current: progress.value.current === prayer,
    }
  }),
)

const weekday = computed(() => formatWeekday(date.value, locale.value))

const dayStatus = computed(() => {
  if (state.value === 'loading') return t('state.loading')
  if (state.value === 'unavailable') return t('state.unavailable')
  if (dayRefreshing.value) return t('state.refreshing')
  return stale.value ? t('state.offline') : ''
})

const dayBusy = computed(
  () => state.value === 'loading' || dayRefreshing.value,
)

const nextSoon = computed(
  () =>
    state.value === 'ready' &&
    progress.value.secondsToNext <= NEXT_SOON_MINUTES * 60,
)

const nextCountdown = computed(() => {
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
  return t('next.countdown', { duration })
})

const passedNote = computed(() => {
  const passedValue = passed.value
  if (state.value !== 'ready' || !passedValue) return ''
  if (passedValue.minutes <= 0) return t('prayer.passedNow')
  return t('prayer.passed', {
    minutes: formatNumber(passedValue.minutes, locale.value),
  })
})

const countdownKey = computed(() =>
  passedNote.value ? '' : progress.value.next,
)

const passedKey = computed(() => (passed.value ? passed.value.prayer : ''))

const nextName = computed(() => t(`prayer.${progress.value.next}`))
const nextTime = computed(
  () =>
    displayRows.value.find((row) => row.prayer === progress.value.next)?.time ??
    summaryRows.value.find((row) => row.prayer === progress.value.next)?.time ??
    '',
)

const progressPercent = computed(() =>
  Math.round(segmentProgress(entries.value, progress.value) * 100),
)

/** The slides, in swipe order, named for the page indicator. */
const slidePages = computed(() => [
  { id: 'summary', label: t('home.summaryTitle') },
  { id: 'today', label: t('home.todayTitle') },
  { id: 'week', label: t('home.weekTitle') },
])

provideHomeDeck({
  district,
  date,
  dates,
  weekday,
  nextName,
  nextTime,
  nextCountdown,
  progressPercent,
  nextSoon,
  summaryRows,
  displayRows,
  countdownKey,
  passedKey,
  passedNote,
  dayStatus,
  dayBusy,
})

function chooseLocale(code: string) {
  setLocale(code as typeof locale.value)
}

function reloadApp() {
  window.location.reload()
}

function reloadCurrent() {
  void reloadData()
}

function openDownloads() {
  void navigateTo('/download')
}

function openTasbih() {
  void navigateTo('/tasbih')
}

function openAyat() {
  void navigateTo('/ayat')
}

function openPrivacy() {
  void navigateTo('/privacy')
}

function openPrayerTimes() {
  void navigateTo(prayerTimesLink(district.value))
}

const rootEl = ref<HTMLElement | null>(null)
const { offset: dragOffset } = useSwipe(
  { right: () => goSlide(-1), left: () => goSlide(1) },
  () => rootEl.value,
)

onMounted(async () => {
  await load()
  syncUrl()
})
</script>

<template>
  <div class="home">
    <div
      v-if="pull > 0 || refreshing"
      class="pull-indicator"
      :class="{ ready: pull >= threshold, refreshing }"
      :style="{
        opacity: Math.min(1, pull / threshold),
        transform: `translateY(${Math.min(pull, threshold)}px)`,
      }"
      role="status"
      aria-live="polite"
    >
      <span>{{ refreshing ? t('pull.refreshing') : t('pull.reload') }}</span>
    </div>

    <div
      ref="rootEl"
      class="layout"
      :style="{ transform: pull ? `translateY(${pull}px)` : undefined }"
    >
      <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>

      <SourceNote
        :label="t('source.label')"
        :name="t('source.name')"
        :url="MORA_PAGE_URL"
      />

      <PageIndicator
        :label="t('home.pages')"
        :pages="slidePages"
        :model-value="slide"
        @update:model-value="goToSlide"
      />

      <div
        id="main"
        class="deck"
        :style="{
          transform: dragOffset ? `translateX(${dragOffset}px)` : undefined,
          transition: dragOffset ? 'none' : undefined,
        }"
        tabindex="-1"
      >
        <!-- specs/web/spec.md — times come from the device cache and the
             network, never SSR, so the slide paints after hydration. -->
        <ClientOnly>
          <slot />
        </ClientOnly>
      </div>

      <AppFooter
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
        :prayer-times-label="t('action.prayerTimes')"
        :tasbih-label="t('action.tasbih')"
        :ayat-label="t('action.ayat')"
        :reload-data-label="t('action.reloadData')"
        :reload-app-label="t('action.reloadApp')"
        :privacy-label="t('action.privacy')"
        :share-label="t('action.share')"
        :share-formatted-label="t('share.formatted')"
        :share-raw-label="t('share.raw')"
        :share-copied-label="t('share.copied')"
        :share-copied="shareCopied"
        :notification-label="notificationLabel"
        :notifications-enabled="notificationsEnabled"
        :notifications-supported="notificationsSupported"
        @update:district="selectDistrict"
        @share="share"
        @update:locale="chooseLocale"
        @update:theme-mode="setMode"
        @update:palette="setPalette"
        @update:custom-color="setCustom"
        @update:time-format="setTimeFormat"
        @downloads="openDownloads"
        @prayer-times="openPrayerTimes"
        @tasbih="openTasbih"
        @ayat="openAyat"
        @reload-data="reloadCurrent"
        @reload-app="reloadApp"
        @privacy="openPrivacy"
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
  </div>
</template>

<style scoped>
.home {
  height: 100vh;
  height: 100dvh;
}
.layout {
  height: 100%;
  max-width: 32rem;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
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
.deck {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease-out;
}
.deck:focus {
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
@media (max-height: 480px) {
  .layout {
    padding: 0.5rem;
    gap: 0.35rem;
  }
}
@media (min-width: 768px) {
  .layout {
    max-width: none;
  }
}
</style>
