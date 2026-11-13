<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DEFAULT_DISTRICT,
  DISTRICTS,
  NEXT_SOON_MINUTES,
  durationParts,
  durationUnits,
  formatNumber,
  formatTime,
  formatWeekday,
} from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import BasmalahText from '~/components/atoms/BasmalahText.vue'
import AppFooter from '~/components/organisms/AppFooter.vue'
import PageIndicator from '~/components/molecules/PageIndicator.vue'
import SourceNote from '~/components/molecules/SourceNote.vue'
import UpdatePrompt from '~/components/molecules/UpdatePrompt.vue'
import { provideHomeDeck, type HomeRow } from '~/composables/useHomeDeck'
import { useNotifications } from '~/composables/useNotifications'
import { usePrayerNotifications } from '~/composables/usePrayerNotifications'
import { usePrayerTimes } from '~/composables/usePrayerTimes'
import { usePwaUpdate } from '~/composables/usePwaUpdate'
import { usePullToRefresh } from '~/composables/usePullToRefresh'
import { useSettings } from '~/composables/useSettings'
import { useSharePrayerTimes } from '~/composables/useSharePrayerTimes'
import { useSwipe } from '~/composables/useSwipe'
import { useWakeLock } from '~/composables/useWakeLock'
import { useTheme } from '~/composables/useTheme'
import { stepHomeSlide, HOME_SLIDE_COOKIE, homeSlideFromPath, homeSlidePath } from '~/utils/homeSlides'
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
const {
  timeFormat,
  setTimeFormat,
  handMode,
  setHandMode,
  background,
  setBackground,
} = useSettings()

const backgroundOptions = computed(() => [
  { value: 'wall' as const, label: t('background.wall') },
  { value: 'aurora' as const, label: t('background.aurora') },
])

const timeFormatOptions = computed(() => [
  { value: '24h' as const, label: t('settings.timeFormat.h24') },
  { value: '12h' as const, label: t('settings.timeFormat.h12') },
])

// specs/web/spec.md — hand mode moves the menu controls to the chosen side.
const handModeOptions = computed(() => [
  { value: 'right' as const, label: t('settings.handMode.right') },
  { value: 'left' as const, label: t('settings.handMode.left') },
])
const menuSide = computed(() =>
  handMode.value === 'left' ? 'start' : 'end',
)

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

// specs/notifications/spec.md — the menu's notification entry carries a dot
// while anything is unread. The check is best-effort and never blocks the day.
const notifications = useNotifications()
const unread = computed(() => notifications.feed.value.unread)

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
  const units = durationUnits(total)
  const duration =
    units === 'seconds'
      ? t('duration.seconds', { seconds: n(seconds) })
      : units === 'minutesSeconds'
        ? t('duration.minutesSeconds', {
            minutes: n(minutes),
            seconds: n(seconds),
          })
        : units === 'hoursMinutes'
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
  if (passedValue.seconds <= 0) return t('prayer.passedNow')
  const total = passedValue.seconds
  const { minutes, seconds } = durationParts(total)
  const n = (value: number) => formatNumber(value, locale.value)
  const duration =
    total < 60
      ? t('duration.seconds', { seconds: n(seconds) })
      : t('duration.minutesSeconds', {
          minutes: n(minutes),
          seconds: n(seconds),
        })
  return t('prayer.passed', { duration })
})

const countdownKey = computed(() =>
  passedNote.value ? '' : progress.value.next,
)

const passedKey = computed(() => (passed.value ? passed.value.prayer : ''))

const nextName = computed(() => t(`prayer.${progress.value.next}`))
const nextTime = computed(
  () =>
    displayRows.value.find((row) => row.prayer === progress.value.next)?.time ??
    '',
)

/** The running entry, for the dashboard's hero. Empty before today's first. */
const currentName = computed(() =>
  progress.value.current ? t(`prayer.${progress.value.current}`) : '',
)
const currentTime = computed(() => {
  const prayer = progress.value.current
  if (!prayer) return ''
  const entry = entries.value.find((item) => item.prayer === prayer)
  return entry ? formatTime(entry.minutes, locale.value, timeFormat.value) : ''
})

/** The slides, in swipe order, named for the page indicator. */
const slidePages = computed(() => [
  { id: 'summary', label: t('home.summaryTitle') },
  { id: 'today', label: t('home.todayTitle') },
  { id: 'week', label: t('home.weekTitle') },
])

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
  void navigateTo('/quran-verse-challenge')
}

function openPrivacy() {
  void navigateTo('/privacy')
}

function openPrayerTimes() {
  void navigateTo(prayerTimesLink(district.value))
}

function openNotifications() {
  void navigateTo('/notifications')
}

function openAbout() {
  void navigateTo('/about')
}

/** The route the reader came from travels with them, so the issue says where. */
function openFeedback() {
  void navigateTo({ path: '/feedback', query: { from: route.path } })
}

// specs/web/spec.md — the dashboard always fills the screen: its card is the
// whole viewport and the deck chrome lives inside it, so the dots sit under the
// basmalah exactly as they do on the other slides. A floating menu button opens
// a dock with the district selector and the settings menu. Escape closes it.
const fsMenu = ref(false)

const { supported: wakeLockSupported, enabled: keepAwake, toggle: toggleKeepAwake, hydrate: hydrateWakeLock } =
  useWakeLock()

function toggleDock() {
  fsMenu.value = !fsMenu.value
}

watch(slide, () => {
  fsMenu.value = false
})

provideHomeDeck({
  district,
  date,
  dates,
  weekday,
  currentName,
  currentTime,
  nextName,
  nextTime,
  nextCountdown,
  nextSoon,
  displayRows,
  countdownKey,
  passedKey,
  passedNote,
  dayStatus,
  dayBusy,
  pages: slidePages,
  goTo: goToSlide,
})

// specs/web/spec.md — the footer's props and handlers live in one place: the
// daily and weekly slides render it inline, the dashboard renders the same
// footer inside its dock.
const footerProps = computed(() => ({
  districtLabel: t('district.label'),
  district: district.value,
  districtOptions: districtOptions.value,
  menuLabel: t('action.menu'),
  settingsLabel: t('settings.title'),
  backLabel: t('settings.back'),
  languageLabel: t('settings.language'),
  locale: locale.value,
  languages: languageOptions.value,
  themeModeLabel: t('theme.mode'),
  themeMode: theme.value.mode,
  themeModes: themeModes.value,
  themePaletteLabel: t('theme.palette.label'),
  palette: theme.value.palette,
  paletteOptions: paletteOptions.value,
  customColor: theme.value.custom,
  customColorLabel: t('theme.palette.custom'),
  timeFormatLabel: t('settings.timeFormat.label'),
  timeFormat: timeFormat.value,
  timeFormatOptions: timeFormatOptions.value,
  handModeLabel: t('settings.handMode.label'),
  handMode: handMode.value,
  handModeOptions: handModeOptions.value,
  // specs/web/spec.md — the backdrop is a summary-slide choice, so only the
  // dashboard's dock offers it; the other slides keep the plain footer.
  backgroundLabel: t('background.label'),
  background: background.value,
  backgroundOptions: backgroundOptions.value,
  downloadsLabel: t('action.downloads'),
  prayerTimesLabel: t('action.prayerTimes'),
  notificationsLabel: t('action.notifications'),
  aboutLabel: t('action.about'),
  feedbackLabel: t('action.feedback'),
  unreadLabel: t('notifications.unreadDot'),
  hasUnread: unread.value > 0,
  tasbihLabel: t('action.tasbih'),
  ayatLabel: t('action.ayat'),
  reloadDataLabel: t('action.reloadData'),
  reloadAppLabel: t('action.reloadApp'),
  privacyLabel: t('action.privacy'),
  shareLabel: t('action.share'),
  shareFormattedLabel: t('share.formatted'),
  shareRawLabel: t('share.raw'),
  shareCopiedLabel: t('share.copied'),
  shareCopied: shareCopied.value,
  notificationLabel: notificationLabel.value,
  notificationsEnabled: notificationsEnabled.value,
  notificationsSupported,
}))

// specs/web/spec.md — `v-on="object"` runs each key through toHandlers, which
// only capitalises the first letter, so a hyphenated key becomes
// `onPrayer-times` and never matches the emitted `prayerTimes`. Keys here must
// be the emit names verbatim, camelCase included.
const footerHandlers = {
  'update:district': selectDistrict,
  share,
  'update:locale': chooseLocale,
  'update:themeMode': setMode,
  'update:palette': setPalette,
  'update:customColor': setCustom,
  'update:timeFormat': setTimeFormat,
  'update:handMode': setHandMode,
  'update:background': setBackground,
  downloads: openDownloads,
  prayerTimes: openPrayerTimes,
  notifications: openNotifications,
  about: openAbout,
  feedback: openFeedback,
  tasbih: openTasbih,
  ayat: openAyat,
  reloadData: reloadCurrent,
  reloadApp: reloadApp,
  privacy: openPrivacy,
  toggleNotifications: toggleNotifications,
}

const rootEl = ref<HTMLElement | null>(null)
const { offset: dragOffset } = useSwipe(
  { right: () => goSlide(-1), left: () => goSlide(1) },
  () => rootEl.value,
)

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !fsMenu.value) return
  fsMenu.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  hydrateWakeLock()
  await load()
  syncUrl()
  // Best-effort; a failed read simply leaves the dot off.
  notifications.load().catch(() => {})
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
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
      :class="{ 'is-full': slide === 'summary' }"
      :style="{ transform: pull ? `translateY(${pull}px)` : undefined }"
    >
      <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>

      <!-- specs/web/spec.md — the summary card is the whole screen and carries
           its own basmalah and page dots, so the deck's chrome is skipped there.
           The other slides read basmalah, dots, then the data-source note. -->
      <template v-if="slide !== 'summary'">
        <BasmalahText class="basmalah" />

        <PageIndicator
          :label="t('home.pages')"
          :pages="slidePages"
          :model-value="slide"
          @update:model-value="goToSlide"
        />

        <SourceNote
          :label="t('source.label')"
          :name="t('source.name')"
          :url="MORA_PAGE_URL"
        />
      </template>

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

      <button
        v-if="slide === 'summary'"
        type="button"
        class="fs-fab"
        :class="{ open: fsMenu }"
        :aria-label="t('action.menu')"
        aria-haspopup="true"
        :aria-expanded="fsMenu"
        :aria-controls="fsMenu ? 'fs-dock' : undefined"
        @click="toggleDock"
      >
        <Icon :name="fsMenu ? 'lucide:x' : 'lucide:settings-2'" aria-hidden="true" />
      </button>

      <div
        v-if="slide === 'summary' && fsMenu"
        id="fs-dock"
        class="fs-dock"
        role="menu"
        :aria-label="t('action.menu')"
      >
        <AppFooter v-bind="footerProps" v-on="footerHandlers" show-background />
        <div v-if="wakeLockSupported" class="fs-actions">
          <button
            type="button"
            class="fs-action"
            :class="{ on: keepAwake }"
            :aria-pressed="keepAwake"
            @click="toggleKeepAwake"
          >
            <Icon
              :name="keepAwake ? 'lucide:sun' : 'lucide:sun-dim'"
              aria-hidden="true"
            />
            <span>{{ t('home.keepAwake') }}</span>
          </button>
        </div>
      </div>

      <AppFooter
        v-if="slide !== 'summary'"
        v-bind="footerProps"
        v-on="footerHandlers"
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
/* The summary card is the whole screen: no deck padding, no chrome above it. */
.layout.is-full {
  max-width: none;
  padding: 0;
  gap: 0;
}
.basmalah {
  flex: none;
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
/* specs/web/spec.md — the dashboard's floating menu: it docks the deck's own
   footer (district, settings) over the card and carries keep-screen-on. */
.fs-fab {
  position: fixed;
  inset-block-end: 0.9rem;
  /* specs/web/spec.md — the floating menu follows the hand mode. */
  left: var(--fab-left);
  right: var(--fab-right);
  z-index: 70;
  display: grid;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  padding: 0;
  border-radius: 50%;
  font-size: 1.1rem;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  color: var(--fg);
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  cursor: pointer;
  opacity: 0.75;
  transition:
    opacity 0.15s ease-out,
    background 0.15s ease-out;
}
.fs-fab:hover,
.fs-fab:focus-visible,
.fs-fab.open {
  opacity: 1;
  background: color-mix(in srgb, var(--primary) 20%, var(--surface));
}

/* The docked footer: the real controls, so district and settings stay in reach. */
.fs-dock {
  position: fixed;
  inset-inline: 0.6rem;
  inset-block-end: 4.2rem;
  z-index: 71;
  max-inline-size: 34rem;
  margin-inline: auto;
  padding: 0.6rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}
.fs-actions {
  margin-block-start: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.4rem;
}
.fs-action {
  inline-size: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-block-size: var(--control-h);
  padding-inline: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.fs-action:hover {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
}
.fs-action.on {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
  color: var(--primary);
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
