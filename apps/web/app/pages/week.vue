<template>
  <main class="week-page">
    <header class="head">
      <NuxtLink class="link" :to="allTimesTo">
        <Icon name="lucide:calendar-days" aria-hidden="true" />
        {{ t('home.allTimes') }}
        <Icon name="lucide:chevron-right" class="chevron" aria-hidden="true" />
      </NuxtLink>
    </header>

    <WeekPrayerTable
      :state="state"
      :columns="columns"
      :rows="rows"
      :entry-label="t('home.entryLabel')"
      :table-label="t('home.weekTableLabel', { period: weekTitle })"
      :loading-text="t('state.loading')"
      :unavailable-text="t('state.unavailable')"
      :offline-text="stale ? t('state.offline') : ''"
      :refreshing="refreshing"
      :refreshing-text="t('state.refreshing')"
    />

    <footer class="controls">
      <MonthSelector
        :label="t('home.weekTitle')"
        :title="weekTitle"
        :current="weekCurrent"
        :prev-label="t('home.prevWeek')"
        :next-label="t('home.nextWeek')"
        :today-label="t('home.thisWeek')"
        @shift="shift"
        @today="reset"
      />
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MonthSelector from '~/components/molecules/MonthSelector.vue'
import WeekPrayerTable from '~/components/organisms/WeekPrayerTable.vue'
import { useHomeDeckContext } from '~/composables/useHomeDeck'
import { usePrayerWeek } from '~/composables/usePrayerWeek'
import { useSettings } from '~/composables/useSettings'
import { prayerTimesLink } from '~/utils/query'

// specs/web/spec.md — `/week` is the weekly slide: one week transposed, prayers
// down the y axis and days across the x axis, with a shortcut to every time.
definePageMeta({ layout: 'home' })

const { t, locale } = useI18n()
const { district, date } = useHomeDeckContext()
const { timeFormat } = useSettings()

const {
  title: weekTitle,
  current: weekCurrent,
  columns,
  rows,
  state,
  stale,
  refreshing,
  shift,
  reset,
} = usePrayerWeek(
  () => district.value,
  () => locale.value,
  () => timeFormat.value,
  () => date.value,
)

const allTimesTo = computed(() => prayerTimesLink(district.value))
</script>

<style scoped>
.week-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  color: var(--fg);
}
.link:hover {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.chevron {
  opacity: 0.6;
}
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
@media (min-width: 768px) {
  .week-page {
    max-width: none;
  }
}
</style>
