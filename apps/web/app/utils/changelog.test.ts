import { describe, expect, it } from 'vitest'
import { APP_VERSION, CHANGELOG, entryFor, isBeta, stableVersion } from './changelog'

// specs/release/spec.md — the bundled changelog is the app's version source.
describe('changelog', () => {
  it('exposes the bundled version and entries', () => {
    expect(APP_VERSION).toBe(CHANGELOG.version)
    expect(CHANGELOG.entries.length).toBeGreaterThan(0)
    expect(CHANGELOG.entries[0]!.version).toBe(APP_VERSION)
  })

  it('marks a prerelease as beta and keeps its core numbers', () => {
    expect(isBeta('4.0.0-beta.3')).toBe(true)
    expect(isBeta('4.0.0')).toBe(false)
    expect(stableVersion('4.0.0-beta.3')).toBe('4.0.0')
  })

  it('finds an entry by version and returns null when absent', () => {
    expect(entryFor(APP_VERSION)?.version).toBe(APP_VERSION)
    expect(entryFor('0.0.0-nope')).toBeNull()
  })
})
