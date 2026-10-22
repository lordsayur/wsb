// specs/tui/spec.md — `wsb update`: compares the baked-in version with the
// latest GitHub release and prints how to install it. Checking never executes
// remote code; only `--apply` runs the same curl installer the docs use.
import { VERSION } from './config.js'
import { t, type Locale } from './i18n.js'

export const RELEASES_URL = 'https://github.com/lordsayur/wsb/releases/latest'
export const LATEST_API = 'https://api.github.com/repos/lordsayur/wsb/releases/latest'
export const INSTALL_URL =
  'https://raw.githubusercontent.com/lordsayur/wsb/main/scripts/install.sh'

/** Parses `v1.2.3` and `1.2.3` into comparable numbers; null when unknown. */
export function parseVersion(value: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(value.trim())
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

/** True when `latest` is a newer semantic version than `current`. */
export function isNewer(current: string, latest: string): boolean {
  const a = parseVersion(current)
  const b = parseVersion(latest)
  if (!a || !b) return false
  for (let index = 0; index < 3; index += 1) {
    if (b[index]! !== a[index]!) return b[index]! > a[index]!
  }
  return false
}

/** Reads `tag_name` from the GitHub release payload; null when absent. */
export function releaseTag(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const tag = (payload as { tag_name?: unknown }).tag_name
  return typeof tag === 'string' && tag.length > 0 ? tag : null
}

/** The latest release tag, or null when the network or response fails. */
export async function latestTag(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(LATEST_API, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': `wsb/${VERSION}` },
    })
    if (!response.ok) return null
    return releaseTag(await response.json())
  } catch {
    return null
  }
}

export type UpdateStatus =
  | { kind: 'current'; version: string }
  | { kind: 'available'; version: string; latest: string }
  | { kind: 'unknown'; version: string }

export function updateStatus(
  current: string,
  latest: string | null,
): UpdateStatus {
  if (!latest) return { kind: 'unknown', version: current }
  if (isNewer(current, latest)) return { kind: 'available', version: current, latest }
  return { kind: 'current', version: current }
}

/** The human line for `wsb update`; the update path is always the installer. */
export function updateReport(status: UpdateStatus, locale: Locale): string {
  if (status.kind === 'unknown') {
    return [
      t(locale, 'tui.update.unknown', { version: status.version }),
      `${t(locale, 'tui.update.command')} curl -fsSL ${INSTALL_URL} | sh`,
    ].join('\n')
  }
  if (status.kind === 'current') {
    return t(locale, 'tui.update.current', { version: status.version })
  }
  return [
    t(locale, 'tui.update.available', {
      version: status.version,
      latest: status.latest,
    }),
    `${t(locale, 'tui.update.command')} curl -fsSL ${INSTALL_URL} | sh`,
    t(locale, 'tui.update.apply'),
  ].join('\n')
}
