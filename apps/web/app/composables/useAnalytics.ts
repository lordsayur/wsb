// specs/web/spec.md — admin analytics panel glue. Reads through the
// `analytics_stats` RPC, which re-checks the allowlist server-side; the shell
// never decides authorization.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalyticsDevice } from '@wsb/data/analytics'
import { supabaseClient } from '~/utils/supabase'

export interface AnalyticsCount {
  views: number
  sessions: number
}

export interface AnalyticsDay {
  day: string
  views: number
  sessions: number
}

export interface AnalyticsSplit {
  views: number
  path?: string
  event?: string
  locale?: string
  device?: AnalyticsDevice
  referrerHost?: string | null
}

export interface AnalyticsStats {
  totals: AnalyticsCount
  previous: AnalyticsCount
  days: AnalyticsDay[]
  topPaths: AnalyticsSplit[]
  events: AnalyticsSplit[]
  locales: AnalyticsSplit[]
  devices: AnalyticsSplit[]
  referrers: AnalyticsSplit[]
}

export const ANALYTICS_RANGES = [7, 30, 90] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export function useAnalytics() {
  const client = supabaseClient()
  const days = ref<AnalyticsRange>(30)
  const includeOther = ref(false)
  const stats = ref<AnalyticsStats | null>(null)
  const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')

  async function load() {
    if (!client) {
      state.value = 'error'
      error.value = 'unavailable'
      return
    }
    state.value = stats.value ? 'ready' : 'loading'
    try {
      const result = await fetchStats(client, days.value, includeOther.value)
      stats.value = result
      state.value = 'ready'
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'failed'
      state.value = 'error'
    }
  }

  function setDays(value: AnalyticsRange) {
    if (days.value === value) return
    days.value = value
    void load()
  }

  function setIncludeOther(value: boolean) {
    if (includeOther.value === value) return
    includeOther.value = value
    void load()
  }

  return {
    days,
    includeOther,
    stats,
    state,
    error,
    load,
    setDays,
    setIncludeOther,
  }
}

async function fetchStats(
  client: SupabaseClient,
  days: number,
  includeOther: boolean,
): Promise<AnalyticsStats> {
  const { data, error } = await client.rpc('analytics_stats', {
    days,
    environment: includeOther ? 'all' : 'production',
  })
  if (error) throw new Error(error.message)
  return normalizeStats(data)
}

const COUNT = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

function normalizeStats(value: unknown): AnalyticsStats {
  const root = (value ?? {}) as Record<string, unknown>
  const count = (input: unknown): AnalyticsCount => {
    const entry = (input ?? {}) as Record<string, unknown>
    return { views: COUNT(entry.views), sessions: COUNT(entry.sessions) }
  }
  const list = <T>(input: unknown, map: (row: Record<string, unknown>) => T) =>
    Array.isArray(input)
      ? input.map((row) => map((row ?? {}) as Record<string, unknown>))
      : []
  return {
    totals: count(root.totals),
    previous: count(root.previous),
    days: list(root.days, (row) => ({
      day: String(row.day ?? ''),
      views: COUNT(row.views),
      sessions: COUNT(row.sessions),
    })),
    topPaths: list(root.topPaths, (row) => ({
      path: String(row.path ?? ''),
      views: COUNT(row.views),
    })),
    events: list(root.events, (row) => ({
      event: String(row.event ?? ''),
      views: COUNT(row.views),
    })),
    locales: list(root.locales, (row) => ({
      locale: String(row.locale ?? ''),
      views: COUNT(row.views),
    })),
    devices: list(root.devices, (row) => ({
      device: row.device as AnalyticsDevice,
      views: COUNT(row.views),
    })),
    referrers: list(root.referrers, (row) => ({
      referrerHost:
        typeof row.referrerHost === 'string' ? row.referrerHost : null,
      views: COUNT(row.views),
    })),
  }
}
