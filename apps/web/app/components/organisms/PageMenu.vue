<template>
  <div ref="wrapEl" class="header-menu">
    <button
      ref="menuButton"
      type="button"
      class="menu-button"
      :aria-label="t('action.menu')"
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="open ? 'page-menu' : undefined"
      @click="toggle"
      @keydown.down.prevent="showMenu"
    >
      <Icon :name="open ? 'lucide:x' : 'lucide:menu'" aria-hidden="true" />
    </button>

    <div
      v-if="open"
      id="page-menu"
      ref="panelEl"
      class="menu-panel"
      :aria-label="t('action.menu')"
      @keydown="onKeydown"
    >
      <template v-if="panel === 'menu'">
        <nav class="menu-list" role="menu" :aria-label="t('action.menu')">
          <button type="button" role="menuitem" aria-haspopup="true" @click="showSettings">
            <Icon name="lucide:settings" aria-hidden="true" />
            {{ t('settings.title') }}
          </button>
          <hr class="divider" />
          <NuxtLink
            v-for="item in items"
            :key="item.to"
            class="menu-item"
            :to="item.to"
            role="menuitem"
            @click="close()"
          >
            <Icon :name="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </NuxtLink>
          <hr class="divider" />
          <NuxtLink class="menu-item" to="/privacy" role="menuitem" @click="close()">
            <Icon name="lucide:shield-check" aria-hidden="true" />
            <span>{{ t('action.privacy') }}</span>
          </NuxtLink>
        </nav>
      </template>

      <template v-else>
        <div class="settings" role="group" :aria-label="t('settings.title')">
          <button type="button" class="settings-back" @click="showMenu">
            <Icon name="lucide:arrow-left" aria-hidden="true" />
            {{ t('settings.back') }}
          </button>
          <hr class="divider" />
          <ThemeControls
            :mode-label="t('theme.mode')"
            :mode="theme.mode"
            :modes="themeModes"
            :palette-label="t('theme.palette.label')"
            :palette="theme.palette"
            :palette-options="paletteOptions"
            :custom="theme.custom"
            :custom-label="t('theme.palette.custom')"
            @update:mode="setMode"
            @update:palette="setPalette"
            @update:custom="setCustom"
          />
          <TimeFormatControls
            :label="t('settings.timeFormat.label')"
            :format="timeFormat"
            :options="timeFormatOptions"
            @update:format="setTimeFormat"
          />
          <HandModeControls
            :label="t('settings.handMode.label')"
            :mode="handMode"
            :options="handModeOptions"
            @update:mode="setHandMode"
          />
          <hr class="divider" />
          <p class="settings-heading">{{ t('settings.language') }}</p>
          <div class="languages">
            <button
              v-for="language in languages"
              :key="language.code"
              type="button"
              :aria-pressed="language.code === locale"
              @click="chooseLocale(language.code)"
            >
              {{ language.name }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the header's menu. It offers the same settings
// the dashboard's footer menu does (theme, time format, hand mode, language)
// plus every destination, so settings are never only reachable from the deck.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ThemeControls from '../molecules/ThemeControls.vue'
import TimeFormatControls from '../molecules/TimeFormatControls.vue'
import HandModeControls from '../molecules/HandModeControls.vue'
import { useSettings } from '~/composables/useSettings'
import { useTheme } from '~/composables/useTheme'
import { PALETTES, type PaletteId, type ThemeMode } from '~/utils/theme'

const { t, locale, locales, setLocale } = useI18n()
// Stories run without Nuxt i18n's locale list, so fall back to the active one.
const localeList = computed(() => locales?.value ?? [])
const { theme, setMode, setPalette, setCustom } = useTheme()
const { timeFormat, setTimeFormat, handMode, setHandMode } = useSettings()

const items = computed(() => [
  { to: '/', icon: 'lucide:house', label: t('action.home') },
  { to: '/prayer-times', icon: 'lucide:chart-line', label: t('action.prayerTimes') },
  { to: '/notifications', icon: 'lucide:bell', label: t('action.notifications') },
  { to: '/tasbih', icon: 'lucide:circle-dot-dashed', label: t('action.tasbih') },
  { to: '/quran-verse-challenge', icon: 'lucide:book-open', label: t('action.ayat') },
  { to: '/download', icon: 'lucide:download', label: t('action.downloads') },
  { to: '/about', icon: 'lucide:info', label: t('action.about') },
  { to: '/feedback', icon: 'lucide:message-square', label: t('action.feedback') },
])

const themeModes = computed(() => [
  { value: 'dark' as ThemeMode, label: t('theme.dark') },
  { value: 'light' as ThemeMode, label: t('theme.light') },
])

const paletteOptions = computed(() =>
  PALETTES.map((palette) => ({
    id: palette.id as PaletteId,
    color: palette.color,
    label: t(`theme.palette.${palette.id}`),
  })),
)

const timeFormatOptions = computed(() => [
  { value: '24h' as const, label: t('settings.timeFormat.h24') },
  { value: '12h' as const, label: t('settings.timeFormat.h12') },
])

const handModeOptions = computed(() => [
  { value: 'right' as const, label: t('settings.handMode.right') },
  { value: 'left' as const, label: t('settings.handMode.left') },
])

const languages = computed(() =>
  localeList.value.map((l) =>
    typeof l === 'string'
      ? { code: l, name: l }
      : { code: l.code, name: l.name ?? l.code },
  ),
)

const open = ref(false)
const panel = ref<'menu' | 'settings'>('menu')
const wrapEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)

function focusFirst() {
  nextTick(() => focusables()[0]?.focus())
}

function showMenu() {
  panel.value = 'menu'
  open.value = true
  focusFirst()
}

function showSettings() {
  panel.value = 'settings'
  focusFirst()
}

function close(restore = true) {
  open.value = false
  panel.value = 'menu'
  if (restore) menuButton.value?.focus()
}

function toggle() {
  if (open.value) close()
  else showMenu()
}

function chooseLocale(code: string) {
  void setLocale(code as typeof locale.value)
}

function focusables() {
  return [
    ...(panelEl.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    ) ?? []),
  ]
}

/** Arrow keys walk the panel, Home/End jump, Escape pops out or closes. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (panel.value === 'settings') {
      panel.value = 'menu'
      focusFirst()
    } else close()
    return
  }
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const list = focusables()
  if (list.length === 0) return
  event.preventDefault()
  const from = list.indexOf(document.activeElement as HTMLElement)
  const last = list.length - 1
  const target =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : event.key === 'ArrowDown'
          ? (from + 1) % list.length
          : (from - 1 + list.length) % list.length
  list[target]?.focus()
}

function onDocumentPointer(event: PointerEvent) {
  if (wrapEl.value && !wrapEl.value.contains(event.target as Node)) close(false)
}

watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', onDocumentPointer)
  else document.removeEventListener('pointerdown', onDocumentPointer)
})

onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', onDocumentPointer),
)
</script>

<style scoped>
.header-menu {
  position: relative;
}
.menu-button {
  display: grid;
  place-items: center;
  inline-size: 2.1rem;
  block-size: 2.1rem;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--fg);
  font-size: 1.15rem;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.menu-button:hover,
.menu-button[aria-expanded='true'] {
  background: color-mix(in srgb, var(--fg) 9%, transparent);
}

.menu-panel {
  position: absolute;
  top: calc(100% + 0.35rem);
  z-index: 20;
  display: flex;
  flex-direction: column;
  min-inline-size: 13rem;
  max-block-size: min(70vh, 34rem);
  overflow-y: auto;
  padding: 0.35rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow);
  /* The panel hangs under the button on whichever side the menu took. */
  left: var(--menu-panel-left, auto);
  right: var(--menu-panel-right, 0);
}

.menu-list,
.settings {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.menu-panel button,
.menu-item {
  font: inherit;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.6rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--fg);
  font-size: 0.88rem;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}
.menu-panel button:hover,
.menu-item:hover,
.menu-panel button:focus-visible,
.menu-item:focus-visible {
  background: color-mix(in srgb, var(--primary) 16%, transparent);
}

.divider {
  margin: 0.2rem 0;
  border: 0;
  border-top: 1px solid var(--border);
}

.settings-back {
  font-weight: 600;
}
.settings-heading {
  margin: 0.2rem 0 0.1rem;
  padding-inline: 0.6rem;
  font-size: 0.8rem;
  opacity: 0.7;
}
.languages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0 0.35rem 0.35rem;
}
.languages button {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.82rem;
}
.languages button[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
</style>
