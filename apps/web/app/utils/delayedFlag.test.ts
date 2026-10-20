import { describe, expect, it, vi } from 'vitest'
import { useDelayedFlag } from './delayedFlag'

describe('useDelayedFlag', () => {
  it('stays false until the delay passes', () => {
    vi.useFakeTimers()
    const { flag, start, stop } = useDelayedFlag(250)
    start()
    expect(flag.value).toBe(false)
    vi.advanceTimersByTime(249)
    expect(flag.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(flag.value).toBe(true)
    stop()
    expect(flag.value).toBe(false)
    vi.useRealTimers()
  })

  it('never flips when stopped before the delay', () => {
    vi.useFakeTimers()
    const { flag, start, stop } = useDelayedFlag(250)
    start()
    stop()
    vi.advanceTimersByTime(1000)
    expect(flag.value).toBe(false)
    vi.useRealTimers()
  })
})
