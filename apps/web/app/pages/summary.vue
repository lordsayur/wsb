<template>
  <HomeSummary
    :weekday="weekday"
    :dates="dates"
    :status="dayStatus"
    :busy="dayBusy"
    :next-label="t('home.nextLabel')"
    :next-name="nextName"
    :next-time="nextTime"
    :countdown="nextCountdown"
    :next-soon="nextSoon"
    :progress-label="t('home.progressLabel')"
    :progress-percent="progressPercent"
    :today-label="t('home.todayGlance')"
    :rows="summaryRows"
    :pending-time="t('state.pending')"
    :all-times-label="t('home.allTimes')"
    :all-times-to="allTimesTo"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeSummary from '~/components/organisms/HomeSummary.vue'
import { useHomeDeckContext } from '~/composables/useHomeDeck'
import { prayerTimesLink } from '~/utils/query'

// specs/web/spec.md — `/summary` is the dashboard slide: the next entry, the
// day at a glance, and a shortcut into every prayer time.
definePageMeta({ layout: 'home' })

const { t } = useI18n()
const {
  weekday,
  dates,
  dayStatus,
  dayBusy,
  nextName,
  nextTime,
  nextCountdown,
  nextSoon,
  progressPercent,
  summaryRows,
  district,
} = useHomeDeckContext()

const allTimesTo = computed(() => prayerTimesLink(district.value))
</script>
