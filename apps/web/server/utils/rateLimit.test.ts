import { describe, expect, it } from 'vitest'
import { createRateLimiter } from './rateLimit'

// specs/feedback/spec.md — the feedback route's flood guard.
describe('createRateLimiter', () => {
  const options = { windowMs: 60_000, max: 3 }

  it('allows up to the maximum inside one window', () => {
    const limiter = createRateLimiter(options)
    expect(limiter.allow('a', 0)).toBe(true)
    expect(limiter.allow('a', 1_000)).toBe(true)
    expect(limiter.allow('a', 2_000)).toBe(true)
    expect(limiter.allow('a', 3_000)).toBe(false)
  })

  it('lets a caller through again once the window passes', () => {
    const limiter = createRateLimiter(options)
    for (let index = 0; index < 3; index += 1) limiter.allow('a', index)
    expect(limiter.allow('a', 70_000)).toBe(true)
  })

  it('counts each key separately', () => {
    const limiter = createRateLimiter(options)
    for (let index = 0; index < 3; index += 1) limiter.allow('a', index)
    expect(limiter.allow('b', 10)).toBe(true)
  })
})
