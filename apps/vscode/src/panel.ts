/**
 * The sidebar view that renders the times panel. Extension host and webview
 * exchange messages; the webview owns only the DOM.
 * specs/vscode/spec.md — no domain rules here.
 */
import * as vscode from 'vscode'
import type { District } from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { WEB_APP_URL } from './shared/constants.js'
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
  | { type: 'open'; url: string }
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
    openApp: s('extension.openApp'),
    sourceName: s('source.name'),
    sourceUrl: MORA_PAGE_URL,
    webUrl: WEB_APP_URL,
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

export class TimesView implements vscode.WebviewViewProvider {
  static readonly viewId = 'wsb.times'

  private view: vscode.WebviewView | null = null

  constructor(
    private readonly getState: () => PanelState,
    private readonly onMessage: (message: PanelMessage) => void,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionRootOf(), 'dist')],
    }
    view.webview.html = html(view.webview)
    view.webview.onDidReceiveMessage((message: PanelMessage) =>
      this.onMessage(message),
    )
    view.onDidDispose(() => {
      if (this.view === view) this.view = null
    })
    this.push()
  }

  push(): void {
    void this.view?.webview.postMessage({
      type: 'state',
      state: this.getState(),
    })
  }

  async reveal(): Promise<void> {
    await vscode.commands.executeCommand(`${TimesView.viewId}.focus`)
  }
}

function html(webview: vscode.Webview): string {
  const root = vscode.Uri.joinPath(extensionRootOf(), 'dist')
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

function extensionRootOf(): vscode.Uri {
  if (!extensionRoot) throw new Error('Extension root not set')
  return extensionRoot
}
