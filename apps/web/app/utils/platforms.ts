// specs/web/spec.md — Other platforms list. The extension ships from GitHub
// releases; the rest are announced but not built yet.
export type PlatformStatus = 'available' | 'soon'

export interface Platform {
  id: 'extension' | 'cli' | 'tui' | 'vscode' | 'raycast'
  status: PlatformStatus
  /** Absolute URL for an available platform. */
  url?: string
  installNote?: 'extension'
}

export const EXTENSION_DOWNLOAD_URL =
  'https://github.com/lordsayur/wsb/releases/latest/download/wsb-extension.zip'

export const PLATFORMS: Platform[] = [
  { id: 'extension', status: 'available', url: EXTENSION_DOWNLOAD_URL, installNote: 'extension' },
  { id: 'cli', status: 'soon' },
  { id: 'tui', status: 'soon' },
  { id: 'vscode', status: 'soon' },
  { id: 'raycast', status: 'soon' },
]
