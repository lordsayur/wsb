<template>
  <footer class="app-footer">
    <section class="controls">
      <DistrictSelector
        v-if="view === 'day'"
        :label="districtLabel"
        :model-value="district"
        :options="districtOptions"
        @update:model-value="emit('update:district', $event)"
      />

      <ShareButton
        v-if="view === 'day'"
        :label="shareLabel"
        :formatted-label="shareFormattedLabel"
        :raw-label="shareRawLabel"
        :copied-label="shareCopiedLabel"
        :copied="shareCopied"
        @share="emit('share', $event)"
      />

      <RangeSelector
        v-if="view === 'trend'"
        :label="rangeLabel"
        :value="range"
        :options="rangeOptions"
        :current="rangeCurrent"
        :prev-label="rangePrevLabel"
        :next-label="rangeNextLabel"
        :today-label="rangeTodayLabel"
        @update:range="emit('update:range', $event)"
        @shift="emit('shiftChart', $event)"
        @today="emit('todayChart')"
      />

      <MonthSelector
        v-if="view === 'month'"
        :label="monthLabel"
        :title="monthTitle"
        :current="monthCurrent"
        :prev-label="monthPrevLabel"
        :next-label="monthNextLabel"
        :today-label="monthTodayLabel"
        @shift="emit('shiftMonth', $event)"
        @today="emit('todayMonth')"
      />

      <div class="menu">
        <button
          ref="menuButton"
          type="button"
          class="menu-button"
          aria-haspopup="true"
          :aria-expanded="open"
          :aria-label="menuLabel"
          @click="toggleMenu"
          @keydown.down.prevent="openMenu"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <div
          v-if="open"
          ref="panelEl"
          class="menu-panel"
          role="menu"
          :aria-label="menuLabel"
          @keydown="onPanelKeydown"
        >
          <template v-if="panel === 'menu'">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="true"
              @click="showSettings"
            >
              {{ settingsLabel }}
            </button>
            <hr class="divider" />
            <button type="button" role="menuitem" @click="openDownloads">
              {{ downloadsLabel }}
            </button>
            <button type="button" role="menuitem" @click="reloadData">
              {{ reloadDataLabel }}
            </button>
            <button type="button" role="menuitem" @click="reloadApp">
              {{ reloadAppLabel }}
            </button>
          </template>

          <template v-else>
            <button
              type="button"
              role="menuitem"
              class="back"
              @click="showMenu"
            >
              <span aria-hidden="true">←</span> {{ backLabel }}
            </button>
            <hr class="divider" />
            <ThemeControls
              :mode-label="themeModeLabel"
              :mode="themeMode"
              :modes="themeModes"
              :palette-label="themePaletteLabel"
              :palette="palette"
              :palette-options="paletteOptions"
              :custom="customColor"
              :custom-label="customColorLabel"
              @update:mode="emit('update:themeMode', $event)"
              @update:palette="emit('update:palette', $event)"
              @update:custom="emit('update:customColor', $event)"
            />
            <TimeFormatControls
              :label="timeFormatLabel"
              :format="timeFormat"
              :options="timeFormatOptions"
              @update:format="emit('update:timeFormat', $event)"
            />
            <hr class="divider" />
            <p class="menu-heading">{{ languageLabel }}</p>
            <div class="languages">
              <button
                v-for="option in languages"
                :key="option.code"
                type="button"
                role="menuitemradio"
                :aria-checked="option.code === locale"
                :aria-pressed="option.code === locale"
                @click="chooseLocale(option.code)"
              >
                {{ option.name }}
              </button>
            </div>
            <hr class="divider" />
            <button
              type="button"
              role="menuitemcheckbox"
              :aria-checked="notificationsEnabled"
              :aria-pressed="notificationsEnabled"
              :disabled="notificationsSupported === false"
              @click="toggleNotifications"
            >
              {{ notificationLabel }}
            </button>
          </template>
        </div>
      </div>
    </section>
  </footer>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: footer with district + menu and data source.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DistrictSelector, {
  type DistrictOption,
} from '../molecules/DistrictSelector.vue'
import ShareButton from '../molecules/ShareButton.vue'
import MonthSelector from '../molecules/MonthSelector.vue'
import RangeSelector, {
  type RangeOption,
} from '../molecules/RangeSelector.vue'
import ThemeControls, {
  type ModeOption,
  type PaletteOption,
} from '../molecules/ThemeControls.vue'
import TimeFormatControls, {
  type TimeFormatOption,
} from '../molecules/TimeFormatControls.vue'
import type { TimeFormat } from '@wsb/core'
import type { PaletteId, ThemeMode } from '~/utils/theme'
import { focusables, onGroupKeydown } from '~/utils/rovingFocus'

export interface LanguageOption {
  code: string
  name: string
}

const props = defineProps<{
  view?: 'day' | 'month' | 'trend'
  rangeLabel: string
  range: string
  rangeOptions: RangeOption[]
  rangeCurrent: boolean
  rangePrevLabel: string
  rangeNextLabel: string
  rangeTodayLabel: string
  monthLabel: string
  monthTitle: string
  monthCurrent: boolean
  monthPrevLabel: string
  monthNextLabel: string
  monthTodayLabel: string
  districtLabel: string
  district: string
  districtOptions: DistrictOption[]
  menuLabel: string
  settingsLabel: string
  backLabel: string
  languageLabel: string
  locale: string
  languages: LanguageOption[]
  themeModeLabel: string
  themeMode: ThemeMode
  themeModes: ModeOption[]
  themePaletteLabel: string
  palette: PaletteId
  paletteOptions: PaletteOption[]
  customColor: string
  customColorLabel: string
  timeFormatLabel: string
  timeFormat: TimeFormat
  timeFormatOptions: TimeFormatOption[]
  downloadsLabel: string
  reloadDataLabel: string
  reloadAppLabel: string
  shareLabel: string
  shareFormattedLabel: string
  shareRawLabel: string
  shareCopiedLabel: string
  shareCopied?: boolean
  notificationLabel: string
  notificationsEnabled: boolean
  notificationsSupported?: boolean
}>()

const emit = defineEmits<{
  shiftMonth: [delta: number]
  'update:range': [value: string]
  shiftChart: [delta: number]
  todayChart: []
  todayMonth: []
  'update:district': [value: string]
  'update:locale': [value: string]
  'update:themeMode': [value: ThemeMode]
  'update:palette': [value: PaletteId]
  'update:customColor': [value: string]
  'update:timeFormat': [value: TimeFormat]
  share: [format: 'formatted' | 'raw']
  downloads: []
  reloadData: []
  reloadApp: []
  toggleNotifications: []
}>()

const open = ref(false)
const panel = ref<'menu' | 'settings'>('menu')
const menuButton = ref<HTMLButtonElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

function openMenu() {
  open.value = true
  nextTick(() => focusables(panelEl.value)[0]?.focus())
}

function toggleMenu() {
  if (open.value) close()
  else openMenu()
}

/** Swap to the settings panel and keep focus inside it. */
function showSettings() {
  panel.value = 'settings'
  nextTick(() => focusables(panelEl.value)[0]?.focus())
}

/** Swap back to the menu panel and keep focus inside it. */
function showMenu() {
  panel.value = 'menu'
  nextTick(() => focusables(panelEl.value)[0]?.focus())
}

function chooseLocale(code: string) {
  emit('update:locale', code)
  close()
}

function openDownloads() {
  emit('downloads')
  close()
}

function reloadData() {
  emit('reloadData')
  close()
}

function reloadApp() {
  emit('reloadApp')
  close()
}

function close() {
  const hadFocus = panelEl.value?.contains(document.activeElement)
  open.value = false
  panel.value = 'menu'
  if (hadFocus) nextTick(() => menuButton.value?.focus())
}

function toggleNotifications() {
  emit('toggleNotifications')
}

/** Arrow keys walk the panel's items; Home/End jump; Escape goes back. */
function onPanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (panel.value === 'settings') {
      panel.value = 'menu'
      nextTick(() => focusables(panelEl.value)[0]?.focus())
    } else close()
    return
  }
  onGroupKeydown(event, panelEl.value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (panel.value === 'settings') panel.value = 'menu'
  else close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.menu {
  position: relative;
}
.menu-button {
  font: inherit;
  font-size: 1.25rem;
  display: grid;
  place-items: center;
  width: var(--control-h);
  height: var(--control-h);
  padding: 0;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
}
.menu-panel {
  position: absolute;
  inset-inline-end: 0;
  bottom: calc(100% + 0.5rem);
  z-index: 10;
  min-width: 12rem;
  max-height: calc(100dvh - 6rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--surface);
  color: var(--fg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.menu-heading {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.divider {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--border);
}
.languages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.menu-panel button {
  font: inherit;
  text-align: start;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border);
  cursor: pointer;
}
.menu-panel button:hover {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.menu-panel button[aria-pressed="true"] {
  font-weight: 700;
  border-color: var(--primary);
}
.back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}
</style>
