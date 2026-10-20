// specs/vscode/spec.md — VS Code shell: status bar item plus the times panel.
// Rendering and platform glue only; core computes and data supplies.
import * as vscode from 'vscode'
import {
  adjustForDistrict,
  bruneiNow,
  type District,
  type PrayerNotification,
} from '@wsb/core'
import type { PrayerRepository } from '@wsb/data'
import { t } from './shared/i18n.js'
import { resolveSettings, type ExtensionSettings } from './shared/settings.js'
import { buildDayView, type DayView } from './shared/view.js'
import { loadDay, mementoCache, repository, type LoadedDay } from './shared/day.js'
import {
  LATE_WINDOW_SECONDS,
  isDue,
  nextReminder,
  reminderId,
  reminderText,
} from './shared/notifications.js'
import { TimesView, panelState, setExtensionRoot, type PanelMessage } from './panel.js'

const STATUS_REFRESH_MS = 30_000
/** Ask once, after install, whether to enable reminders. */
export const PROMPTED_KEY = 'wsb.promptedNotifications'

let repo: PrayerRepository | null = null
let statusItem: vscode.StatusBarItem | null = null
let timesView: TimesView | null = null
let day: LoadedDay | null = null
let loading = true
let timer: ReturnType<typeof setTimeout> | undefined
let pending: PrayerNotification | undefined
const fired = new Set<string>()

function settings(): ExtensionSettings {
  return resolveSettings(vscode.workspace.getConfiguration('wsb'))
}

function view(now = bruneiNow().seconds): DayView | null {
  return day ? buildDayView(day, settings(), now) : null
}

function renderStatus(): void {
  if (!statusItem) return
  const current = settings()
  if (!current.statusBar) {
    statusItem.hide()
    return
  }
  const dayView = view()
  if (!dayView) {
    const key = loading ? 'state.loading' : 'state.unavailable'
    statusItem.text = `$(clock) ${t(current.locale, key)}`
    statusItem.tooltip = undefined
    statusItem.show()
    return
  }
  // The label carries the current entry; the next one lives in the tooltip so
  // the status bar stays quiet.
  const currentLabel = dayView.currentPrayer
    ? `${dayView.currentPrayer} ${dayView.currentTime}`
    : dayView.nextPrayer
  statusItem.text = `$(clock) ${currentLabel}`
  statusItem.tooltip = [
    `${dayView.weekday} · ${dayView.masihi} · ${dayView.hijri}`,
    dayView.next,
    t(current.locale, `district.${current.district}`),
    t(current.locale, 'source.name'),
  ].join('\n')
  statusItem.show()
}

function render(): void {
  renderStatus()
  timesView?.push()
}

async function refresh(force = false): Promise<void> {
  if (!repo) return
  day = await loadDay(repo, force)
  loading = false
  render()
  schedule()
}

/**
 * Best-effort in-editor reminders: a timer on core's schedule fires while the
 * extension host runs. ponytail: VS Code has no background worker, so nothing
 * fires while the editor is closed; upgrade path is an OS-level notifier.
 */
function schedule(): void {
  clearTimeout(timer)
  pending = undefined
  if (!settings().notifications || !day) return
  const event = nextReminder(
    adjustForDistrict(day.entries, settings().district),
    bruneiNow().seconds,
    fired,
  )
  if (!event) return
  pending = event
  // A due event fires now; an upcoming one waits until it enters the window.
  const delay = isDue(event)
    ? Math.max(0, event.secondsUntil)
    : Math.max(0, event.secondsUntil - LATE_WINDOW_SECONDS)
  timer = setTimeout(fire, delay * 1_000)
}

async function fire(): Promise<void> {
  const event = pending
  pending = undefined
  if (!event) return
  if (settings().notifications && isDue(event)) {
    fired.add(reminderId(event))
    const { title, body } = reminderText(event, settings())
    void vscode.window.showInformationMessage(`${title} — ${body}`)
  }
  schedule()
}

function onPanelMessage(message: PanelMessage): void {
  if (message.type === 'ready') {
    timesView?.push()
    return
  }
  if (message.type === 'open') {
    // The webview cannot open arbitrary links; the host owns the URI.
    if (/^https:\/\//.test(message.url)) {
      void vscode.env.openExternal(vscode.Uri.parse(message.url))
    }
    return
  }
  if (message.type === 'reload') {
    loading = true
    render()
    void refresh(true)
    return
  }
  const config = vscode.workspace.getConfiguration('wsb')
  void config.update(
    message.key,
    message.key === 'district' ? (message.value as District) : message.value,
    vscode.ConfigurationTarget.Global,
  )
}

/** Asks once after install; the answer is the runtime opt-in. */
async function promptNotifications(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(PROMPTED_KEY)) return
  await context.globalState.update(PROMPTED_KEY, true)
  const current = settings()
  if (current.notifications) return
  const answer = await vscode.window.showInformationMessage(
    t(current.locale, 'extension.enablePrompt'),
    t(current.locale, 'extension.enableYes'),
    t(current.locale, 'extension.enableNo'),
  )
  if (answer !== t(current.locale, 'extension.enableYes')) return
  await vscode.workspace
    .getConfiguration('wsb')
    .update('notifications', true, vscode.ConfigurationTarget.Global)
  schedule()
}

export function activate(context: vscode.ExtensionContext): void {
  setExtensionRoot(context.extensionUri)
  repo = repository(mementoCache(context.globalState))

  statusItem = vscode.window.createStatusBarItem(
    'wsb.next',
    vscode.StatusBarAlignment.Right,
    100,
  )
  statusItem.name = t(settings().locale, 'extension.title')
  statusItem.command = 'wsb.openPanel'

  timesView = new TimesView(
    () => panelState(settings(), view(), loading, day?.stale ?? false),
    onPanelMessage,
  )

  context.subscriptions.push(
    statusItem,
    vscode.window.registerWebviewViewProvider(TimesView.viewId, timesView, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand('wsb.openPanel', () => timesView?.reveal()),
    vscode.commands.registerCommand('wsb.reloadData', () => {
      loading = true
      render()
      return refresh(true)
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('wsb')) return
      if (statusItem) statusItem.name = t(settings().locale, 'extension.title')
      render()
      schedule()
    }),
  )

  render()
  void refresh()
  void promptNotifications(context)

  const clock = setInterval(render, STATUS_REFRESH_MS)
  context.subscriptions.push({ dispose: () => clearInterval(clock) })
}

export function deactivate(): void {
  clearTimeout(timer)
  pending = undefined
  timesView = null
}
