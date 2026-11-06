// specs/release/spec.md — the changelog the app renders. `changelog.json` is
// written by `scripts/version.mjs` from `CHANGELOG.md`, so the version shown at
// runtime is the version in the record, never a hard-coded string.
import bundled from '~/data/changelog.json'
import type { VersionNotice } from '@wsb/data/notifications'

export interface ChangelogEntry extends VersionNotice {}

export interface Changelog {
  version: string
  entries: ChangelogEntry[]
}

export const CHANGELOG: Changelog = bundled as Changelog

/** The running app version. */
export const APP_VERSION = CHANGELOG.version

/** True while the version carries a prerelease suffix (`4.0.0-beta.1`). */
export function isBeta(version: string = APP_VERSION): boolean {
  return version.includes('-')
}

/** The version's core numbers, without a prerelease suffix. */
export function stableVersion(version: string = APP_VERSION): string {
  return version.split('-')[0] ?? version
}

export function entryFor(
  version: string,
  changelog: Changelog = CHANGELOG,
): ChangelogEntry | null {
  return changelog.entries.find((entry) => entry.version === version) ?? null
}
