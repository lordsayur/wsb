<template>
  <footer class="app-footer">
    <section class="controls">
      <DistrictSelector
        :label="districtLabel"
        :model-value="district"
        :options="districtOptions"
        @update:model-value="emit('update:district', $event)"
      />

      <ShareButton
        :label="shareLabel"
        :formatted-label="shareFormattedLabel"
        :raw-label="shareRawLabel"
        :copied-label="shareCopiedLabel"
        :copied="shareCopied"
        @share="emit('share', $event)"
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
          <Icon name="lucide:menu" size="1.25rem" aria-hidden="true" />
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
              <Icon name="lucide:settings" aria-hidden="true" />
              {{ settingsLabel }}
            </button>
            <hr class="divider" />
            <button type="button" role="menuitem" @click="openPrayerTimes">
              <Icon name="lucide:chart-line" aria-hidden="true" />
              {{ prayerTimesLabel }}
            </button>
            <button type="button" role="menuitem" @click="openNotifications">
              <Icon name="lucide:bell" aria-hidden="true" />
              <span class="notify-label">{{ notificationsLabel }}</span>
              <span
                v-if="hasUnread"
                class="unread-dot"
                aria-hidden="true"
              />
              <span v-if="hasUnread" class="sr-only">{{ unreadLabel }}</span>
            </button>
            <button type="button" role="menuitem" @click="openTasbih">
              <Icon name="lucide:circle-dot-dashed" aria-hidden="true" />
              {{ tasbihLabel }}
            </button>
            <button type="button" role="menuitem" @click="openAyat">
              <Icon name="lucide:book-open" aria-hidden="true" />
              {{ ayatLabel }}
            </button>
            <button type="button" role="menuitem" @click="openDownloads">
              <Icon name="lucide:download" aria-hidden="true" />
              {{ downloadsLabel }}
            </button>
            <button type="button" role="menuitem" @click="openAbout">
              <Icon name="lucide:info" aria-hidden="true" />
              {{ aboutLabel }}
            </button>
            <button type="button" role="menuitem" @click="openFeedback">
              <Icon name="lucide:message-square" aria-hidden="true" />
              {{ feedbackLabel }}
            </button>
          </template>

          <template v-else>
            <button
              type="button"
              role="menuitem"
              class="back"
              @click="showMenu"
            >
              <Icon name="lucide:arrow-left" aria-hidden="true" /> {{ backLabel }}
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
            <HandModeControls
              :label="handModeLabel"
              :mode="handMode"
              :options="handModeOptions"
              @update:mode="emit('update:handMode', $event)"
            />
            <BackgroundControls
              v-if="showBackground"
              :label="backgroundLabel"
              :background="background"
              :options="backgroundOptions"
              @update:background="emit('update:background', $event)"
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
              <Icon name="lucide:bell" aria-hidden="true" />
              {{ notificationLabel }}
            </button>
            <hr class="divider" />
            <button type="button" role="menuitem" @click="reloadData">
              <Icon name="lucide:refresh-cw" aria-hidden="true" />
              {{ reloadDataLabel }}
            </button>
            <button type="button" role="menuitem" @click="reloadApp">
              <Icon name="lucide:rotate-ccw" aria-hidden="true" />
              {{ reloadAppLabel }}
            </button>
            <hr class="divider" />
            <button type="button" role="menuitem" @click="openPrivacy">
              <Icon name="lucide:shield-check" aria-hidden="true" />
              {{ privacyLabel }}
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
import ThemeControls, {
  type ModeOption,
  type PaletteOption,
} from '../molecules/ThemeControls.vue'
import TimeFormatControls, {
  type TimeFormatOption,
} from '../molecules/TimeFormatControls.vue'
import HandModeControls, {
  type HandModeOption,
} from '../molecules/HandModeControls.vue'
import BackgroundControls, {
  type BackgroundOption,
} from '../molecules/BackgroundControls.vue'
import type { TimeFormat } from '@wsb/core'
import type { HandMode } from '~/utils/handMode'
import type { BackgroundStyle } from '~/utils/background'
import type { PaletteId, ThemeMode } from '~/utils/theme'
import { focusables, onGroupKeydown } from '~/utils/rovingFocus'

export interface LanguageOption {
  code: string
  name: string
}

defineProps<{
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
  handModeLabel: string
  handMode: HandMode
  handModeOptions: HandModeOption[]
  /** The summary's backdrop choice; only that slide offers it. */
  showBackground?: boolean
  backgroundLabel: string
  background: BackgroundStyle
  backgroundOptions: BackgroundOption[]
  downloadsLabel: string
  prayerTimesLabel: string
  notificationsLabel: string
  aboutLabel: string
  feedbackLabel: string
  unreadLabel: string
  hasUnread?: boolean
  tasbihLabel: string
  ayatLabel: string
  reloadDataLabel: string
  reloadAppLabel: string
  privacyLabel: string
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
  'update:district': [value: string]
  'update:locale': [value: string]
  'update:themeMode': [value: ThemeMode]
  'update:palette': [value: PaletteId]
  'update:customColor': [value: string]
  'update:timeFormat': [value: TimeFormat]
  'update:handMode': [value: HandMode]
  'update:background': [value: BackgroundStyle]
  share: [format: 'formatted' | 'raw']
  downloads: []
  prayerTimes: []
  notifications: []
  about: []
  feedback: []
  tasbih: []
  ayat: []
  reloadData: []
  reloadApp: []
  privacy: []
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

function openPrayerTimes() {
  emit('prayerTimes')
  close()
}

function openTasbih() {
  emit('tasbih')
  close()
}

function openNotifications() {
  emit('notifications')
  close()
}

function openAbout() {
  emit('about')
  close()
}

function openFeedback() {
  emit('feedback')
  close()
}

function openAyat() {
  emit('ayat')
  close()
}

function openPrivacy() {
  emit('privacy')
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
  gap: 0.4rem;
}
.menu {
  position: relative;
  flex: none;
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
  min-width: 13.5rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
.notify-label {
  flex: 1;
}
.unread-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--primary);
  flex: none;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
