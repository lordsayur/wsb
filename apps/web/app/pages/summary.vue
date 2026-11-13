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
    :pages="pages"
    :current="'summary'"
    :pages-label="t('home.pages')"
    @select="goTo"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import HomeSummary from '~/components/organisms/HomeSummary.vue'
import { useHomeDeckContext } from '~/composables/useHomeDeck'
import { useSettings } from '~/composables/useSettings'

// specs/web/spec.md — `/summary` is the dashboard slide: the running entry,
// then the next one with its countdown. The card is the whole screen, so it
// carries the basmalah and the page dots at its own top.
definePageMeta({ layout: 'home' })

const { t } = useI18n()
const { background } = useSettings()
const {
  weekday,
  dates,
  dayStatus,
  dayBusy,
  pages,
  goTo,
  currentName,
  currentTime,
  nextName,
  nextTime,
  nextCountdown,
  passedNote,
  nextSoon,
} = useHomeDeckContext()
</script>
