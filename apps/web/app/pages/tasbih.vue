<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@wsb/core'
import PageHeader from '~/components/organisms/PageHeader.vue'
import TasbihCounter from '~/components/organisms/TasbihCounter.vue'
import {
  DECREMENT_VIBRATION,
  INCREMENT_VIBRATION,
  MILESTONE_VIBRATION,
  RESET_VIBRATION,
  vibrate,
} from '~/utils/haptics'
import {
  deviceNotificationsEnabled,
  deviceNotificationsSupported,
  requestDeviceNotifications,
  showDeviceNotification,
} from '~/utils/notify'
import { displayDigits } from '~/utils/segments'
import {
  TASBIH_DEFAULT_STEP,
  clampCount,
  clampStep,
  decrementCount,
  incrementCount,
  isMilestone,
} from '~/utils/tasbih'

// specs/web/spec.md — tasbih page: tap anywhere to count, except the controls.
// The count, its step, and the notification choice survive a reload.
const { t, locale } = useI18n()

const COUNT_KEY = 'wsb.tasbihCount'
const STEP_KEY = 'wsb.tasbihStep'
const count = useState('wsb:tasbih', () => 0)
const step = useState('wsb:tasbihStep', () => TASBIH_DEFAULT_STEP)
const digits = computed(() => displayDigits(count.value))
const formatted = computed(() => formatNumber(count.value, locale.value))
const formattedStep = computed(() => formatNumber(step.value, locale.value))

const notificationsSupported = ref(false)
const notificationsEnabled = ref(false)
const notificationsBlocked = ref(false)

async function enableNotifications() {
  notificationsEnabled.value = await requestDeviceNotifications()
  notificationsBlocked.value =
    notificationsSupported.value && !notificationsEnabled.value
}

function onStepInput(event: Event) {
  step.value = clampStep(Number((event.target as HTMLInputElement).value))
}

function increment() {
  count.value = incrementCount(count.value)
  if (isMilestone(count.value, step.value)) {
    vibrate(MILESTONE_VIBRATION)
    void notifyMilestone()
    return
  }
  vibrate(INCREMENT_VIBRATION)
}

async function notifyMilestone() {
  await showDeviceNotification(
    t('tasbih.notifyTitle', { count: formatted.value }),
    t('tasbih.notifyBody', {
      count: formatted.value,
      step: formattedStep.value,
    }),
    `wsb-tasbih-${count.value}`,
  )
}

function decrement() {
  count.value = decrementCount(count.value)
  vibrate(DECREMENT_VIBRATION)
}

function reset() {
  if (count.value > 0 && !window.confirm(t('tasbih.resetConfirm'))) return
  count.value = 0
  vibrate(RESET_VIBRATION)
}

/** Taps on links and controls keep their own behaviour. */
function onPageClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button, input, select, textarea')) return
  increment()
}

/** Space/Enter count from anywhere, matching the tap gesture. */
function onKeydown(event: KeyboardEvent) {
  if (event.repeat || event.defaultPrevented) return
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, select, textarea')) return
  if (event.key !== ' ' && event.key !== 'Enter') return
  event.preventDefault()
  increment()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  notificationsSupported.value = deviceNotificationsSupported()
  notificationsEnabled.value = deviceNotificationsEnabled()
  notificationsBlocked.value =
    notificationsSupported.value &&
    'Notification' in window &&
    Notification.permission === 'denied'
  const storedCount = Number(window.localStorage.getItem(COUNT_KEY))
  if (Number.isFinite(storedCount) && storedCount > 0) {
    count.value = clampCount(storedCount)
  }
  const storedStep = Number(window.localStorage.getItem(STEP_KEY))
  if (Number.isFinite(storedStep) && storedStep >= 1) {
    step.value = clampStep(storedStep)
  }
})

watch([count, step], ([nextCount, nextStep]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COUNT_KEY, String(nextCount))
  window.localStorage.setItem(STEP_KEY, String(nextStep))
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

useSeoMeta({
  title: () => t('tasbih.title'),
  description: () => t('tasbih.intro'),
})
</script>

<template>
  <div class="page" @click="onPageClick">
    <main class="content">
      <PageHeader
        class="head"
        :title="t('tasbih.title')"
        :intro="t('tasbih.intro')"
      />

      <div class="device-slot">
        <TasbihCounter
          :digits="digits"
          :label="t('tasbih.label', { count: formatted })"
          :increment-label="t('tasbih.increment')"
          :decrement-label="t('tasbih.decrement')"
          :reset-label="t('tasbih.reset')"
          @increment="increment"
          @decrement="decrement"
          @reset="reset"
        />
      </div>

      <p class="count" role="status" aria-live="polite">
        {{ t('tasbih.count', { count: formatted }) }}
      </p>
      <p class="hint">{{ t('tasbih.hint') }}</p>

      <div class="milestone" @click.stop>
        <label class="step">
          <span>{{ t('tasbih.stepLabel') }}</span>
          <input
            type="number"
            inputmode="numeric"
            min="1"
            max="9999"
            step="1"
            :value="step"
            @change="onStepInput"
          />
        </label>
        <button
          v-if="notificationsSupported && !notificationsEnabled && !notificationsBlocked"
          type="button"
          class="notify"
          @click.stop="enableNotifications"
        >
          {{ t('tasbih.enableNotifications') }}
        </button>
        <span v-else-if="notificationsBlocked" class="notify-note">
          {{ t('notification.blocked') }}
        </span>
        <span v-else-if="notificationsEnabled" class="notify-note">
          {{ t('tasbih.notificationsOn', { step: formattedStep }) }}
        </span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 0 1rem 0.75rem;
  /* specs/web/spec.md — the whole counter fits without scrolling: the device
     takes the leftover height and the rest is fixed. */
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.content {
  width: 100%;
  max-width: 32rem;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.75rem;
}
.head,
.count,
.hint,
.milestone {
  flex: none;
  width: 100%;
}
.head {
  text-align: start;
}
.count {
  text-align: center;
}
.hint {
  text-align: center;
}
/* The device is the only flexible row, so it shrinks on short screens instead
   of pushing the controls out of view. */
.device-slot {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: grid;
  place-items: center;
  /* The slot is the measuring stick: 75cqh is exactly the width a 3:4 device
     can be at the slot's height. */
  container-type: size;
}
.device-slot :deep(.tasbih-counter) {
  width: min(21rem, 78vw, 75cqh);
  height: auto;
}
.hint {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.milestone {
  justify-content: center;
}
.count {
  margin: 0;
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.milestone {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  cursor: default;
  user-select: auto;
  -webkit-user-select: auto;
}
.step {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.step input {
  width: 5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--fg) 25%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--surface-2) 80%, transparent);
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.notify {
  padding: 0.35rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--primary) 55%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--primary) 15%, transparent);
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.notify-note {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
