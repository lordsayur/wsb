import { describe, expect, it } from 'vitest'
import {
  ANALYTICS_DEVICES,
  buildPageview,
  deviceClass,
  isAnalyticsEnvironment,
  type PageviewInput,
} from './analytics.js'

// specs/analytics/spec.md — acceptance criteria for the client-side builder.

const base: PageviewInput = {
  path: '/',
  search: '',
  locale: 'ms',
  width: 390,
  referrer: null,
  origin: 'https://wsb.example',
  environment: 'production',
  sessionId: 'session-abcdefgh',
  userAgent: 'Mozilla/5.0 (iPhone)',
}

function build(overrides: Partial<PageviewInput> = {}) {
  return buildPageview({ ...base, ...overrides })
}

describe('deviceClass', () => {
  it('maps viewport widths at the documented breakpoints', () => {
    expect(deviceClass(320)).toBe('mobile')
    expect(deviceClass(767)).toBe('mobile')
    expect(deviceClass(768)).toBe('tablet')
    expect(deviceClass(1023)).toBe('tablet')
    expect(deviceClass(1024)).toBe('desktop')
    expect(deviceClass(1920)).toBe('desktop')
  })

  it('treats a non-finite width as mobile', () => {
    expect(deviceClass(Number.NaN)).toBe('mobile')
    expect(deviceClass(Number.POSITIVE_INFINITY)).toBe('mobile')
  })
})

describe('isAnalyticsEnvironment', () => {
  it('accepts only the three known environments', () => {
    expect(isAnalyticsEnvironment('production')).toBe(true)
    expect(isAnalyticsEnvironment('preview')).toBe(true)
    expect(isAnalyticsEnvironment('development')).toBe(true)
    expect(isAnalyticsEnvironment('staging')).toBe(false)
  })
})

describe('buildPageview', () => {
  it('records the route path and drops the query string', () => {
    const row = build({
      path: '/prayer-times/graph',
      search: '?range=year&date=2026-01-01',
    })
    expect(row?.path).toBe('/prayer-times/graph')
    expect(row?.props).toEqual({ range: 'year' })
  })

  it('keeps the path when the router already stripped the query', () => {
    expect(build({ path: '/prayer-times/graph', search: '' })?.path).toBe(
      '/prayer-times/graph',
    )
  })

  it('treats the month table and the graph as separate pages', () => {
    expect(build({ path: '/prayer-times', search: '' })?.path).toBe(
      '/prayer-times',
    )
    expect(build({ path: '/prayer-times/graph', search: '' })?.path).toBe(
      '/prayer-times/graph',
    )
  })

  it('records only allowlisted props for the month table', () => {
    const row = build({
      path: '/prayer-times',
      search: '?month=2026-02&utm_source=x&district=tutong',
    })
    expect(row?.props).toEqual({ month: '2026-02', district: 'tutong' })
  })

  it('leaves the default district out', () => {
    const row = build({ path: '/prayer-times', search: '?district=bruneiMuara' })
    expect(row?.props).toEqual({})
  })

  it('drops an unknown or malformed month and range', () => {
    const table = build({ path: '/prayer-times', search: '?month=2026-13' })
    expect(table?.props).toEqual({})

    const graph = build({
      path: '/prayer-times/graph',
      search: '?range=decade',
    })
    expect(graph?.props).toEqual({})
  })

  it('ignores the week range the graph does not offer', () => {
    const row = build({ path: '/prayer-times/graph', search: '?range=week' })
    expect(row?.props).toEqual({})
  })

  it('ignores query keys on paths that own none', () => {
    const row = build({
      path: '/ayat',
      search: '?view=month&range=year&month=2026-02',
    })
    expect(row?.props).toEqual({})
  })

  it('drops view and month from the home path', () => {
    expect(
      build({ path: '/', search: '?view=month&month=2026-02' })?.props,
    ).toEqual({})
  })

  it('drops a same-origin referrer', () => {
    const row = build({
      path: '/prayer-times/graph',
      referrer: 'https://wsb.example/?view=month',
    })
    expect(row?.referrer_host).toBeNull()
  })

  it('keeps the referring host only, without path or query', () => {
    const row = build({
      path: '/prayer-times/graph',
      referrer: 'https://news.example/article?id=3',
    })
    expect(row?.referrer_host).toBe('news.example')
  })

  it('records no referrer for a malformed or empty value', () => {
    expect(build({ referrer: '' })?.referrer_host).toBeNull()
    expect(build({ referrer: 'not a url' })?.referrer_host).toBeNull()
  })

  it('never records /admin', () => {
    expect(build({ path: '/admin', search: '' })).toBeNull()
    expect(build({ path: '/admin/records' })).toBeNull()
  })

  it('rejects a bot user agent', () => {
    expect(build({ userAgent: 'Googlebot/2.1' })).toBeNull()
    expect(build({ userAgent: 'Mozilla/5.0 HeadlessChrome' })).toBeNull()
  })

  it('rejects a malformed session id', () => {
    expect(build({ sessionId: 'short' })).toBeNull()
    expect(build({ sessionId: 'has space in it' })).toBeNull()
  })

  it('rejects an unknown environment', () => {
    expect(
      build({ environment: 'staging' as PageviewInput['environment'] }),
    ).toBeNull()
  })

  it('records a non-default district', () => {
    expect(build({ search: '?district=belait' })?.props.district).toBe('belait')
  })

  it('bounds the locale and falls back to Malay', () => {
    expect(build({ locale: 'ms-Arab' })?.locale).toBe('ms-Arab')
    expect(build({ locale: '   ' })?.locale).toBe('ms')
    expect(build({ locale: 'a-very-long-locale-tag' })?.locale).toBe(
      'a-very-l',
    )
  })

  it('returns a row shaped like the table columns', () => {
    const row = build()
    expect(Object.keys(row ?? {}).sort()).toEqual(
      [
        'device',
        'environment',
        'event',
        'locale',
        'path',
        'props',
        'referrer_host',
        'session_id',
      ].sort(),
    )
    expect(ANALYTICS_DEVICES).toContain(row?.device)
  })
})
