// specs/extension/spec.md — update awareness. The extension is distributed as
// an unpacked zip, so Chrome never checks for updates; the worker compares the
// installed version with the latest GitHub release and surfaces a download.
import { RELEASES_URL } from './constants.js'

export const UPDATE_API_URL =
  'https://api.github.com/repos/lordsayur/wsb/releases/latest'
export const UPDATE_KEY = 'wsb.extension.update'
export const UPDATE_ALARM_NAME = 'wsb:update'
/** Four checks a day is well inside GitHub's unauthenticated rate limit. */
export const UPDATE_PERIOD_MINUTES = 360

export interface UpdateState {
  latest: string | null
  available: boolean
}

export const NO_UPDATE: UpdateState = { latest: null, available: false }

function parts(version: string): number[] {
  return version
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0)
}

/** True when `latest` is a strictly higher major.minor.patch than `current`. */
export function isNewer(latest: string, current: string): boolean {
  const a = parts(latest)
  const b = parts(current)
  for (let index = 0; index < 3; index += 1) {
    const left = a[index] ?? 0
    const right = b[index] ?? 0
    if (left !== right) return left > right
  }
  return false
}

export async function getUpdateState(): Promise<UpdateState> {
  const values = await chrome.storage.local.get(UPDATE_KEY)
  const stored = values[UPDATE_KEY] as Partial<UpdateState> | undefined
  return {
    latest: typeof stored?.latest === 'string' ? stored.latest : null,
    available: stored?.available === true,
  }
}

async function publish(state: UpdateState): Promise<UpdateState> {
  await chrome.storage.local.set({ [UPDATE_KEY]: state })
  await chrome.action.setBadgeText({ text: state.available ? '↑' : '' })
  await chrome.action.setBadgeBackgroundColor({ color: '#facc15' })
  return state
}

/** Fetches the latest release tag; never throws, keeps the last known state. */
export async function checkForUpdate(
  current: string = chrome.runtime.getManifest().version,
): Promise<UpdateState> {
  try {
    const response = await fetch(UPDATE_API_URL, {
      headers: { accept: 'application/vnd.github+json' },
      cache: 'no-store',
    })
    if (!response.ok) return getUpdateState()
    const release = (await response.json()) as { tag_name?: unknown }
    const tag = typeof release.tag_name === 'string' ? release.tag_name : null
    if (!tag) return getUpdateState()
    return publish({ latest: tag, available: isNewer(tag, current) })
  } catch {
    return getUpdateState()
  }
}

export function updateDownloadUrl(): string {
  return RELEASES_URL
}
