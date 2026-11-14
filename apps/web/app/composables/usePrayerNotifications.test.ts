import { describe, expect, it } from 'vitest'
import { notificationSchedule, type PrayerEntry } from '@wsb/core'
import { pendingReminder, reminderKey } from './usePrayerNotifications'

// specs/web/spec.md — one notification per reminder occurrence.

const entries: PrayerEntry[] = [
  { prayer: 'imsak', minutes: 4 * 60 + 41 },
  { prayer: 'subuh', minutes: 4 * 60 + 50 },
  { prayer: 'syuruk', minutes: 6 * 60 + 5 },
  { prayer: 'doha', minutes: 6 * 60 + 40 },
  { prayer: 'zuhur', minutes: 12 * 60 + 5 },
  { prayer: 'asar', minutes: 15 * 60 + 20 },
  { prayer: 'maghrib', minutes: 18 * 60 + 10 },
  { prayer: 'isyak', minutes: 19 * 60 + 20 },
]

const leadSeconds = (12 * 60 + 5 - 15) * 60

describe('pendingReminder', () => {
  it('arms the nearest upcoming reminder', () => {
    const next = pendingReminder(notificationSchedule(entries, leadSeconds - 60))
    expect(next).toMatchObject({ prayer: 'zuhur', kind: 'lead' })
  })

  it('does not re-arm the reminder that just fired at this second', () => {
    const events = notificationSchedule(entries, leadSeconds)
    expect(events[0]).toMatchObject({ kind: 'lead', secondsUntil: 0 })

    const fired = new Set([reminderKey(events[0]!)])
    const next = pendingReminder(events, fired)
    expect(next).toMatchObject({ prayer: 'zuhur', kind: 'due' })
  })

  it('arms the next prayer once both of its reminders fired', () => {
    const events = notificationSchedule(entries, leadSeconds)
    const fired = new Set(
      events
        .filter((event) => event.prayer === 'zuhur')
        .map((event) => reminderKey(event)),
    )
    expect(pendingReminder(events, fired)).toMatchObject({
      prayer: 'asar',
      kind: 'lead',
    })
  })

  it('keeps tomorrow\u2019s same prayer a distinct occurrence', () => {
    const today = notificationSchedule(entries, leadSeconds)[0]!
    const tomorrow = notificationSchedule(entries, leadSeconds + 24 * 60 * 60)[0]!
    expect(tomorrow).toMatchObject({ prayer: 'zuhur', kind: 'lead' })
    expect(reminderKey(tomorrow)).not.toBe(reminderKey(today))
  })

  it('leaves no due reminder armed while the clock stays in the prayer second', () => {
    const events = notificationSchedule(entries, leadSeconds)
    const fired = new Set([reminderKey(events[0]!)])
    const next = pendingReminder(events, fired)!
    expect(next.secondsUntil).toBeGreaterThan(0)
  })
})
