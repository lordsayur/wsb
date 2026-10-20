<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@wsb/core'
import TasbihCounter from '~/components/organisms/TasbihCounter.vue'
import {
  DECREMENT_VIBRATION,
  INCREMENT_VIBRATION,
  RESET_VIBRATION,
  vibrate,
} from '~/utils/haptics'
import { displayDigits } from '~/utils/segments'
import { decrementCount, incrementCount } from '~/utils/tasbih'

// specs/web/spec.md — tasbih page: tap anywhere to count, except the controls.
// The count survives in-app navigation while the tab is open.
const { t, locale } = useI18n()

const count = useState('wsb:tasbih', () => 0)
const digits = computed(() => displayDigits(count.value))
const formatted = computed(() => formatNumber(count.value, locale.value))

function increment() {
  count.value = incrementCount(count.value)
  vibrate(INCREMENT_VIBRATION)
}

function decrement() {
  count.value = decrementCount(count.value)
  vibrate(DECREMENT_VIBRATION)
}

function reset() {
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

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

useSeoMeta({
  title: () => t('tasbih.title'),
  description: () => t('tasbih.intro'),
})
</script>

<template>
  <div class="page" @click="onPageClick">
    <main class="content">
      <header class="head">
        <NuxtLink class="back" to="/">
          <Icon name="lucide:arrow-left" aria-hidden="true" />
          {{ t('tasbih.back') }}
        </NuxtLink>
        <h1 class="title">{{ t('tasbih.title') }}</h1>
        <p class="intro">{{ t('tasbih.intro') }}</p>
      </header>

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

      <p class="count" role="status" aria-live="polite">
        {{ t('tasbih.count', { count: formatted }) }}
      </p>
      <p class="hint">{{ t('tasbih.hint') }}</p>
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
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.content {
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.head {
  width: 100%;
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
.intro,
.hint {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.count {
  margin: 0;
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
</style>
