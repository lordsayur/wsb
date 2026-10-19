import { describe, expect, it } from 'vitest'
import {
  PULL_MAX,
  PULL_THRESHOLD,
  pullDistance,
  shouldRefresh,
} from './usePullToRefresh'

// specs/web/spec.md — pull-to-refresh resistance and release threshold.
describe('pull-to-refresh', () => {
  it('resists the movement and caps the pull', () => {
    expect(pullDistance(0)).toBe(0)
    expect(pullDistance(-40)).toBe(0)
    expect(pullDistance(40)).toBe(20)
    expect(pullDistance(1_000)).toBe(PULL_MAX)
  })

  it('refreshes only at or past the threshold', () => {
    expect(shouldRefresh(PULL_THRESHOLD - 1)).toBe(false)
    expect(shouldRefresh(PULL_THRESHOLD)).toBe(true)
  })
})
