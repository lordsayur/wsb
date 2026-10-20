// specs/web/spec.md — monthly view: reads a month through the port and formats
// display-ready rows. Core computes; the shell renders.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DEFAULT_TIME_FORMAT,
  PRAYER_ORDER,
  bruneiNow,
  formatDayNumber,
  formatMonth,
  formatTime,
  formatWeekday,
  monthOf,
  prayerProgress,
  shiftMonth,
  type District,
  type PrayerEntry,
  type TimeFormat,
} from '@wsb/core'
import { getPrayerRepository } from './usePrayerTimes'
import { useDelayedFlag } from '~/utils/delayedFlag'

export interface MonthRow {
  prayer: string
  label: string
  time: string
  current: boolean
}

export interface MonthDayRow {
  date: string
  day: string
  weekday: string
  hijri: string
  today: boolean
  entries: MonthRow[]
}

interface LoadedMonthDay {
  date: string
  entries: PrayerEntry[]
  hijriDate: string
}

export function usePrayerMonth(
  district: () => District,
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
  active: () => boolean = () => true,
) {
  const { t } = useI18n()
  const month = ref(monthOf(bruneiNow().date))
  const days = ref<LoadedMonthDay[]>([])
  const state = ref<'loading' | 'ready' | 'unavailable'>('loading')
  const stale = ref(false)
  const { flag: refreshing, start: startRefreshing, stop: stopRefreshing } =
    useDelayedFlag()

  const title = computed(() => formatMonth(month.value, locale()))

  const columns = computed(() =>
    PRAYER_ORDER.map((prayer) => ({
      prayer,
      label: t(`prayer.${prayer}`),
    })),
  )

  const rows = computed<MonthDayRow[]>(() =>
    days.value.map((day) => {
      const isToday = day.date === bruneiNow().date
      const progress = prayerProgress(
        day.entries,
        isToday ? bruneiNow().seconds : -1,
      )
      return {
        date: day.date,
        day: formatDayNumber(day.date, locale()),
        weekday: formatWeekday(day.date, locale(), 'short'),
        hijri: day.hijriDate,
        today: isToday,
        entries: PRAYER_ORDER.map((prayer) => {
          const entry = day.entries.find((item) => item.prayer === prayer)
          return {
            prayer,
            label: t(`prayer.${prayer}`),
            time: entry
              ? formatTime(entry.minutes, locale(), timeFormat())
              : '—',
            current: isToday && progress.current === prayer,
          }
        }),
      }
    }),
  )

  /** specs/web/spec.md — paint the cached month before any network work. */
  function paintFromCache() {
    const peek = getPrayerRepository().peekMonth?.(month.value, district())
    if (peek?.status !== 'ok') return false
    days.value = peek.days
    stale.value = peek.stale
    state.value = 'ready'
    return true
  }

  async function load() {
    if (!active()) return
    if (!paintFromCache()) {
      state.value = 'loading'
      days.value = []
      stale.value = false
    }
    if (state.value === 'ready') startRefreshing()
    const result = await getPrayerRepository().readMonth(
      month.value,
      district(),
    )
    stopRefreshing()
    if (result.status === 'unavailable') {
      if (state.value !== 'ready') {
        state.value = 'unavailable'
        days.value = []
      }
      return
    }
    days.value = result.days
    stale.value = result.stale
    state.value = 'ready'
  }

  function shift(delta: number) {
    month.value = shiftMonth(month.value, delta)
  }

  function setMonth(next: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(next)) return
    month.value = next
  }

  watch([month, district, active], load, { immediate: true })

  async function loadIfActive() {
    if (active()) await load()
  }

  return {
    month,
    title,
    columns,
    rows,
    state,
    refreshing,
    stale,
    shift,
    setMonth,
    reload: loadIfActive,
  }
}
