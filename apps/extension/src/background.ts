// specs/extension/spec.md — background service worker: keeps the day cache
// warm, schedules reminder alarms, and displays notifications.
import { adjustForDistrict, bruneiNow } from '@wsb/core'
import { FIRED_KEY, ALARM_NAME, dueReminders, reminderText } from './shared/reminders.js'
import { getSettings } from './shared/settings.js'
import { loadDay } from './shared/day.js'
import { ALARM_PERIOD_MINUTES } from './shared/constants.js'
import { t } from './shared/i18n.js'
import { buildDayView } from './shared/view.js'
import { UPDATE_ALARM_NAME, UPDATE_PERIOD_MINUTES, checkForUpdate } from './shared/update.js'

async function refreshAndSchedule(): Promise<void> {
  const settings = await getSettings()
  const day = await loadDay(true)
  void checkForUpdate()
  chrome.alarms.create(UPDATE_ALARM_NAME, {
    periodInMinutes: UPDATE_PERIOD_MINUTES,
  })
  if (!day) return
  if (!settings.notifications) {
    await chrome.alarms.clear(ALARM_NAME)
    return
  }
  await checkReminders()
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES })
}

async function checkReminders(): Promise<void> {
  const settings = await getSettings()
  if (!settings.notifications) return
  const day = await loadDay()
  if (!day) return

  const values = await chrome.storage.local.get(FIRED_KEY)
  const fired = Array.isArray(values[FIRED_KEY])
    ? (values[FIRED_KEY] as string[])
    : []
  const entries = adjustForDistrict(day.entries, settings.district)
  const due = dueReminders(entries, bruneiNow().seconds, fired)
  if (due.length === 0) return

  for (const reminder of due) {
    const { title, message } = reminderText(reminder.event, settings)
    await chrome.notifications.create(`wsb-${reminder.id}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title,
      message,
    })
  }
  // Keep the recent ids so late/alarm-overlap ticks never double-fire.
  const nextFired = [...fired, ...due.map((reminder) => reminder.id)].slice(-20)
  await chrome.storage.local.set({ [FIRED_KEY]: nextFired })
}

chrome.runtime.onInstalled.addListener(() => void refreshAndSchedule())
chrome.runtime.onStartup.addListener(() => void refreshAndSchedule())
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void checkReminders()
  if (alarm.name === UPDATE_ALARM_NAME) void checkForUpdate()
})
chrome.storage.onChanged.addListener((changes) => {
  if ('wsb.extension.settings' in changes) void refreshAndSchedule()
})
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  void (async () => {
    if (message === 'wsb:refresh') {
      await loadDay(true)
      respond(true)
      return
    }
    if (message === 'wsb:header') {
      const settings = await getSettings()
      const day = settings.header ? await loadDay() : null
      if (!day) {
        respond({ enabled: settings.header && day !== null, text: '' })
        return
      }
      const view = buildDayView(day, settings)
      respond({
        enabled: true,
        text: view.next,
        soon: view.soon,
        label: t(settings.locale, 'extension.pageHeaderLabel'),
        closeLabel: t(settings.locale, 'extension.closeLabel'),
        rows: view.rows,
      })
      return
    }
    if (message === 'wsb:update') {
      respond(await checkForUpdate())
      return
    }
    respond(undefined)
  })()
  return true
})
