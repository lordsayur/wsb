import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { District, PrayerProgress } from '@wsb/core'

// specs/web/spec.md — the home layout owns the day's data and the footer; the
// slide pages only render it. This is the contract between the two.

export interface HomeRow {
  prayer: string
  label: string
  time: string
  current: boolean
}

export interface HomeDeckContext {
  district: Ref<District>
  date: Ref<string>
  dates: ComputedRef<{ masihi: string; hijri: string }>
  weekday: ComputedRef<string>
  /** The translated name of the entry after the current one. */
  nextName: ComputedRef<string>
  nextTime: ComputedRef<string>
  nextCountdown: ComputedRef<string>
  /** How far the current interval has run, 0..100. */
  progressPercent: ComputedRef<number>
  nextSoon: ComputedRef<boolean>
  /** Every entry of today, in prayer order, for the summary grid. */
  summaryRows: ComputedRef<HomeRow[]>
  /** The rows the daily list shows, phase-dependent. */
  displayRows: ComputedRef<HomeRow[]>
  countdownKey: ComputedRef<string>
  passedKey: ComputedRef<string>
  passedNote: ComputedRef<string>
  dayStatus: ComputedRef<string>
  dayBusy: ComputedRef<boolean>
}

export const HOME_DECK_KEY: InjectionKey<HomeDeckContext> =
  Symbol('wsb.homeDeck')

export function provideHomeDeck(context: HomeDeckContext): void {
  provide(HOME_DECK_KEY, context)
}

export function useHomeDeckContext(): HomeDeckContext {
  const context = inject(HOME_DECK_KEY, null)
  if (!context) {
    throw new Error('useHomeDeckContext must be used inside the home layout')
  }
  return context
}
