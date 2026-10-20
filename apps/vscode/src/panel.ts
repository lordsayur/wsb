/**
 * The webview-rendered times panel. Extension host and webview exchange
 * messages; the webview owns only the DOM.
 * specs/vscode/spec.md — no domain rules here.
 */
import * as vscode from 'vscode'
import type { District } from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { t, type Locale } from './shared/i18n.js'
import type { ExtensionSettings } from './shared/settings.js'
import type { DayView } from './shared/view.js'

export interface PanelState {
  loading: boolean
  stale: boolean
  view: DayView | null
  settings: ExtensionSettings
  districts: { value: District; label: string }[]
  locales: { value: Locale; label: string }[]
  strings: Record<string, string>
}

export type PanelMessage =
  | { type: 'ready' }
  | { type: 'reload' }
  | { type: 'setting'; key: 'locale' | 'timeFormat' | 'district'; value: string }

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'ms-Arab', label: 'بهاس ملايو (Jawi)' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
]

const DISTRICTS: District[] = ['bruneiMuara', 'tutong', 'belait']

/** Every runtime string the webview needs; translation keys, no literals. */
function panelStrings(settings: ExtensionSettings): Record<string, string> {
  const s = (key: string) => t(settings.locale, key)
  return {
    loading: s('state.loading'),
    unavailable: s('state.unavailable'),
    offline: s('state.offline'),
    settingsTitle: s('settings.title'),
    districtLabel: s('district.label'),
    language: s('settings.language'),
    timeFormat: s('settings.timeFormat.label'),
    h24: s('settings.timeFormat.h24'),
    h12: s('settings.timeFormat.h12'),
    reload: s('action.reloadData'),
    sourceName: s('source.name'),
    sourceUrl: MORA_PAGE_URL,
  }
}

export function panelState(
  settings: ExtensionSettings,
  view: DayView | null,
  loading: boolean,
  stale: boolean,
): PanelState {
  return {
    loading,
    stale,
    view,
    settings,
    districts: DISTRICTS.map((district) => ({
      value: district,
      label: t(settings.locale, `district.${district}`),
    })),
    locales: LOCALES,
    strings: panelStrings(settings),
  }
}

export class TimesPanel {
  private static current: TimesPanel | null = null
  private readonly panel: vscode.WebviewPanel
  private readonly getState: () => PanelState
  private readonly onMessage: (message: PanelMessage) => void

  private constructor(
    panel: vscode.WebviewPanel,
    getState: () => PanelState,
    onMessage: (message: PanelMessage) => void,
  ) {
    this.panel = panel
    this.getState = getState
    this.onMessage = onMessage

    panel.webview.html = html(panel.webview)
    panel.webview.onDidReceiveMessage((message: PanelMessage) =>
      this.onMessage(message),
    )
    panel.onDidDispose(() => {
      if (TimesPanel.current === this) TimesPanel.current = null
    })
  }

  static show(
    extensionUri: vscode.Uri,
    getState: () => PanelState,
    onMessage: (message: PanelMessage) => void,
  ): TimesPanel {
    if (TimesPanel.current) {
      TimesPanel.current.panel.reveal()
      TimesPanel.current.push()
      return TimesPanel.current
    }
    const panel = vscode.window.createWebviewPanel(
      'wsb.times',
      t(getState().settings.locale, 'extension.title'),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      },
    )
    TimesPanel.current = new TimesPanel(panel, getState, onMessage)
    return TimesPanel.current
  }

  push(): void {
    const state = this.getState()
    this.panel.title = t(state.settings.locale, 'extension.title')
    void this.panel.webview.postMessage({ type: 'state', state })
  }

  reveal(): void {
    this.panel.reveal()
  }
}

function html(webview: vscode.Webview): string {
  const root = vscode.Uri.joinPath(
    extensionRootOf(webview),
    'dist',
  )
  const asset = (name: string) =>
    webview.asWebviewUri(vscode.Uri.joinPath(root, name))
  const nonce = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)],
  ).join('')
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ')
  return `<!doctype html>
<html lang="ms">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="${asset('panel.css')}" />
    <style>
      @font-face {
        font-family: 'Noto Naskh Arabic';
        src: url('${asset('fonts/NotoNaskhArabic-Regular.woff2')}') format('woff2');
        font-weight: 400;
        font-display: swap;
      }
      @font-face {
        font-family: 'Noto Naskh Arabic';
        src: url('${asset('fonts/NotoNaskhArabic-Bold.woff2')}') format('woff2');
        font-weight: 700;
        font-display: swap;
      }
    </style>
  </head>
  <body>
    <div id="app" class="app"></div>
    <script nonce="${nonce}" src="${asset('panel.js')}"></script>
  </body>
</html>`
}

// The webview root is the extension directory; the host sets it once at
// activation so the template can resolve dist/ assets.
let extensionRoot: vscode.Uri | null = null

export function setExtensionRoot(uri: vscode.Uri): void {
  extensionRoot = uri
}

function extensionRootOf(_webview: vscode.Webview): vscode.Uri {
  if (!extensionRoot) throw new Error('Extension root not set')
  return extensionRoot
}
