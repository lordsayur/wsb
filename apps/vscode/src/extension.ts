// specs/vscode/spec.md — VS Code shell: status bar item plus the times panel.
// Rendering and platform glue only; core computes and data supplies.
import * as vscode from 'vscode'
import { bruneiNow, type District } from '@wsb/core'
import type { PrayerRepository } from '@wsb/data'
import { t } from './shared/i18n.js'
import { resolveSettings, type ExtensionSettings } from './shared/settings.js'
import { buildDayView, type DayView } from './shared/view.js'
import { loadDay, mementoCache, repository, type LoadedDay } from './shared/day.js'
import { TimesPanel, panelState, setExtensionRoot, type PanelMessage } from './panel.js'

const STATUS_REFRESH_MS = 30_000

let repo: PrayerRepository | null = null
let statusItem: vscode.StatusBarItem | null = null
let panel: TimesPanel | null = null
let day: LoadedDay | null = null
let loading = true

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
  statusItem.text = `$(clock) ${dayView.nextPrayer} ${dayView.nextTime}`
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
  panel?.push()
}

async function refresh(force = false): Promise<void> {
  if (!repo) return
  day = await loadDay(repo, force)
  loading = false
  render()
}

function onPanelMessage(message: PanelMessage): void {
  if (message.type === 'ready') {
    panel?.push()
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

  context.subscriptions.push(
    statusItem,
    vscode.commands.registerCommand('wsb.openPanel', () => {
      panel = TimesPanel.show(
        context.extensionUri,
        () => panelState(settings(), view(), loading, day?.stale ?? false),
        onPanelMessage,
      )
      panel.push()
    }),
    vscode.commands.registerCommand('wsb.reloadData', () => {
      loading = true
      render()
      return refresh(true)
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('wsb')) return
      if (statusItem) statusItem.name = t(settings().locale, 'extension.title')
      render()
    }),
  )

  render()
  void refresh()

  const clock = setInterval(render, STATUS_REFRESH_MS)
  context.subscriptions.push({ dispose: () => clearInterval(clock) })
}

export function deactivate(): void {
  panel = null
}
