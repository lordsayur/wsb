// specs/web/spec.md — Other platforms list. Shells ship from GitHub releases;
// the rest are announced but not built yet.
export type PlatformStatus = 'available' | 'soon'

export interface Platform {
  id: 'extension' | 'tui' | 'vscode' | 'raycast'
  status: PlatformStatus
  /** Absolute URL for an available platform. */
  url?: string
  /** Optional install-from-registry URL shown next to the download action. */
  storeUrl?: string
  installNote?: 'extension' | 'vscode' | 'tui'
  /** Terminal one-liner shown in the card with a copy button. */
  command?: string
  /** Preview image served from /public. */
  screenshot?: string
  screenshotAlt?: string
}

export const EXTENSION_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-extension.zip'
export const VSCODE_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-vscode.vsix'
export const VSCODE_MARKETPLACE_URL =
  'https://marketplace.visualstudio.com/items?itemName=lordsayur.wsb-vscode'
export const TUI_RELEASES_URL = 'https://github.com/lordsayur/wsb/releases/latest'
export const TUI_INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/lordsayur/wsb/main/scripts/install.sh | sh'

export const PLATFORMS: Platform[] = [
  { id: 'extension', status: 'available', url: EXTENSION_DOWNLOAD_URL, installNote: 'extension' },
  {
    id: 'vscode',
    status: 'available',
    url: VSCODE_DOWNLOAD_URL,
    storeUrl: VSCODE_MARKETPLACE_URL,
    installNote: 'vscode',
  },
  {
    id: 'tui',
    status: 'available',
    url: TUI_RELEASES_URL,
    command: TUI_INSTALL_COMMAND,
    installNote: 'tui',
    screenshot: '/tui-screenshot.png',
  },
  { id: 'raycast', status: 'soon' },
]
