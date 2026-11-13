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
  /** The translated name of the running entry; empty before the first one. */
  currentName: ComputedRef<string>
  /** The running entry's time, display-ready; empty before the first one. */
  currentTime: ComputedRef<string>
  /** The translated name of the entry after the current one. */
  nextName: ComputedRef<string>
  nextTime: ComputedRef<string>
  nextCountdown: ComputedRef<string>
  /** The passed-entry note, shown in place of the countdown. */
  passedNote: ComputedRef<string>
  nextSoon: ComputedRef<boolean>
  /** The rows the daily list shows, phase-dependent. */
  displayRows: ComputedRef<HomeRow[]>
  countdownKey: ComputedRef<string>
  passedKey: ComputedRef<string>
  dayStatus: ComputedRef<string>
  dayBusy: ComputedRef<boolean>
  /** The slides, in swipe order, for the page indicator. */
  pages: ComputedRef<{ id: string; label: string }[]>
  /** Opens a slide by id. */
  goTo: (id: string) => void
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
