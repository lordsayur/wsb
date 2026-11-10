<template>
  <HomeSummary
    :weekday="weekday"
    :dates="dates"
    :status="dayStatus"
    :busy="dayBusy"
    :current-name="currentName"
    :current-time="currentTime"
    :current-label="t('home.currentLabel')"
    :next-label="t('home.nextLabel')"
    :next-name="nextName"
    :next-time="nextTime"
    :countdown="nextCountdown"
    :passed-note="passedNote"
    :next-soon="nextSoon"
    :pending-time="t('state.pending')"
    :background="background"
    :fullscreen="fullscreen"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import HomeSummary from '~/components/organisms/HomeSummary.vue'
import { useHomeDeckContext } from '~/composables/useHomeDeck'
import { useSettings } from '~/composables/useSettings'

// specs/web/spec.md — `/summary` is the dashboard slide: the running entry,
// then the next one with its countdown. The grid and the shortcut are gone, so
// the day reads at a glance and leaves room for future additions.
definePageMeta({ layout: 'home' })

const { t } = useI18n()
const { background } = useSettings()
const {
  weekday,
  dates,
  dayStatus,
  dayBusy,
  fullscreen,
  currentName,
  currentTime,
  nextName,
  nextTime,
  nextCountdown,
  passedNote,
  nextSoon,
} = useHomeDeckContext()
</script>
