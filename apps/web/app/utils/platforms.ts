// specs/web/spec.md — Other platforms list. Shells ship from GitHub releases;
// the rest are announced but not built yet.
export type PlatformStatus = 'available' | 'soon'

export interface Platform {
  id: 'extension' | 'cli' | 'tui' | 'vscode' | 'raycast'
  status: PlatformStatus
  /** Absolute URL for an available platform. */
  url?: string
  /** Optional install-from-registry URL shown next to the download action. */
  storeUrl?: string
  installNote?: 'extension' | 'vscode' | 'tui'
}

export const EXTENSION_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-extension.zip'
export const VSCODE_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-vscode.vsix'
export const VSCODE_MARKETPLACE_URL =
  'https://marketplace.visualstudio.com/items?itemName=lordsayur.wsb-vscode'
export const TUI_RELEASES_URL = 'https://github.com/lordsayur/wsb/releases/latest'

export const PLATFORMS: Platform[] = [
  { id: 'extension', status: 'available', url: EXTENSION_DOWNLOAD_URL, installNote: 'extension' },
  {
    id: 'vscode',
    status: 'available',
    url: VSCODE_DOWNLOAD_URL,
    storeUrl: VSCODE_MARKETPLACE_URL,
    installNote: 'vscode',
  },
  { id: 'cli', status: 'soon' },
  { id: 'tui', status: 'available', url: TUI_RELEASES_URL, installNote: 'tui' },
  { id: 'raycast', status: 'soon' },
]
