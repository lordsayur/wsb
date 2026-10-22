import { describe, expect, it } from 'vitest'
import {
  isNewer,
  parseVersion,
  releaseTag,
  updateReport,
  updateStatus,
} from './update.js'

// specs/tui/spec.md — acceptance criteria for `wsb update` (no network here).
describe('versions', () => {
  it('parses tags with and without the v prefix', () => {
    expect(parseVersion('v1.2.3')).toEqual([1, 2, 3])
    expect(parseVersion('1.4.0')).toEqual([1, 4, 0])
    expect(parseVersion('nope')).toBeNull()
  })

  it('only treats a strictly newer version as an update', () => {
    expect(isNewer('1.0.0', 'v1.0.1')).toBe(true)
    expect(isNewer('1.0.0', 'v1.0.0')).toBe(false)
    expect(isNewer('1.2.0', 'v1.1.9')).toBe(false)
    expect(isNewer('0.0.0', 'garbage')).toBe(false)
  })

  it('reads tag_name from a release payload', () => {
    expect(releaseTag({ tag_name: 'v2.0.0' })).toBe('v2.0.0')
    expect(releaseTag({})).toBeNull()
    expect(releaseTag(null)).toBeNull()
  })
})

describe('status', () => {
  it('distinguishes current, available and unknown', () => {
    expect(updateStatus('1.0.0', null)).toEqual({ kind: 'unknown', version: '1.0.0' })
    expect(updateStatus('1.0.0', 'v1.0.0')).toEqual({ kind: 'current', version: '1.0.0' })
    expect(updateStatus('1.0.0', 'v1.1.0')).toEqual({
      kind: 'available',
      version: '1.0.0',
      latest: 'v1.1.0',
    })
  })

  it('always shows the installer command', () => {
    expect(updateReport({ kind: 'current', version: '1.0.0' }, 'en')).not.toContain(
      'curl',
    )
    expect(updateReport({ kind: 'unknown', version: '1.0.0' }, 'en')).toContain('curl')
    const available = updateReport(
      { kind: 'available', version: '1.0.0', latest: 'v1.1.0' },
      'en',
    )
    expect(available).toContain('v1.1.0')
    expect(available).toContain('--apply')
  })
})
