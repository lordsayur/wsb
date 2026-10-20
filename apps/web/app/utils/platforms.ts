// specs/web/spec.md — Other platforms list. Shells ship from GitHub releases;
// the rest are announced but not built yet.
export type PlatformStatus = 'available' | 'soon'

export interface Platform {
  id: 'extension' | 'cli' | 'tui' | 'vscode' | 'raycast'
  status: PlatformStatus
  /** Absolute URL for an available platform. */
  url?: string
  installNote?: 'extension' | 'vscode'
}

export const EXTENSION_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-extension.zip'
export const VSCODE_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-vscode.vsix'

export const PLATFORMS: Platform[] = [
  { id: 'extension', status: 'available', url: EXTENSION_DOWNLOAD_URL, installNote: 'extension' },
  { id: 'vscode', status: 'available', url: VSCODE_DOWNLOAD_URL, installNote: 'vscode' },
  { id: 'cli', status: 'soon' },
  { id: 'tui', status: 'soon' },
  { id: 'raycast', status: 'soon' },
]
