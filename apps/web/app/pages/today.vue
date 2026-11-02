<template>
  <main class="day" tabindex="-1">
    <p class="weekday">{{ weekday }}</p>
    <DateDisplay :masihi="dates.masihi" :hijri="dates.hijri" />
    <DayStatus :text="dayStatus" :busy="dayBusy" />

    <PrayerTimeList
      :rows="displayRows"
      :countdown-key="countdownKey"
      :countdown="nextCountdown"
      :passed-key="passedKey"
      :passed-note="passedNote"
      :note-soon="noteSoon"
      :pending-time="t('state.pending')"
    />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DateDisplay from '~/components/molecules/DateDisplay.vue'
import DayStatus from '~/components/molecules/DayStatus.vue'
import PrayerTimeList from '~/components/organisms/PrayerTimeList.vue'
import { useHomeDeckContext } from '~/composables/useHomeDeck'

// specs/web/spec.md — `/today` is the daily slide: the app's original home.
definePageMeta({ layout: 'home' })

const { t } = useI18n()
const {
  weekday,
  dates,
  dayStatus,
  dayBusy,
  displayRows,
  countdownKey,
  nextCountdown,
  passedKey,
  passedNote,
  nextSoon,
} = useHomeDeckContext()

const noteSoon = computed(() => !passedNote.value && nextSoon.value)
</script>

<style scoped>
.day {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
}
.day:focus {
  outline: none;
}
.weekday {
  margin: 0;
  font-size: clamp(1.15rem, 4vh, 1.5rem);
  font-weight: 700;
}
@media (max-height: 480px) {
  .day {
    gap: 0.25rem;
  }
  .weekday {
    font-size: 1.1rem;
  }
  .day :deep(.prayer-row) {
    padding-block: 0.2rem;
  }
}
</style>
