import { describe, expect, it } from 'vitest'
import { barHeights, changePercent } from './analytics'

// specs/web/spec.md — analytics panel totals and chart scaling.
describe('changePercent', () => {
  it('rounds the change against the previous period', () => {
    expect(changePercent(120, 100)).toBe(20)
    expect(changePercent(80, 100)).toBe(-20)
    expect(changePercent(100, 100)).toBe(0)
  })

  it('has no percentage without a previous base', () => {
    expect(changePercent(0, 0)).toBe(0)
    expect(changePercent(7, 0)).toBeNull()
  })
})

describe('barHeights', () => {
  it('scales each day against the busiest day', () => {
    expect(
      barHeights([
        { day: '2026-10-01', views: 0, sessions: 0 },
        { day: '2026-10-02', views: 5, sessions: 3 },
        { day: '2026-10-03', views: 10, sessions: 8 },
      ]),
    ).toEqual([0, 50, 100])
  })

  it('renders flat bars when nothing was recorded', () => {
    expect(
      barHeights([
        { day: '2026-10-01', views: 0, sessions: 0 },
        { day: '2026-10-02', views: 0, sessions: 0 },
      ]),
    ).toEqual([0, 0])
  })
})
