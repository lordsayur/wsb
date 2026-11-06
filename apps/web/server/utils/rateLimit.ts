// specs/feedback/spec.md — a fixed-window rate limit for the feedback route.
// In-memory per instance: enough to blunt a flood, not a distributed quota.
// ponytail: upgrade to a shared store (Supabase row or Redis) when abuse is real.
export interface RateLimiterOptions {
  /** Window length in milliseconds. */
  windowMs: number
  /** Requests allowed per window per key. */
  max: number
  /** Keys retained before expired ones are swept. */
  capacity?: number
}

export interface RateLimiter {
  /** True when this call is allowed; records it when so. */
  allow(key: string, now?: number): boolean
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max, capacity = 5000 } = options
  const hits = new Map<string, number[]>()

  return {
    allow(key, now = Date.now()) {
      const window = (hits.get(key) ?? []).filter((at) => now - at < windowMs)
      if (window.length >= max) {
        hits.set(key, window)
        return false
      }
      window.push(now)
      hits.set(key, window)
      if (hits.size > capacity) {
        for (const [candidate, times] of hits) {
          if (times.every((at) => now - at >= windowMs)) hits.delete(candidate)
        }
      }
      return true
    },
  }
}
