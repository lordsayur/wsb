import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOME_SLIDE,
  HOME_SLIDES,
  homeSlideFromPath,
  homeSlideIndex,
  homeSlidePath,
  isHomeSlide,
  resolveHomeSlide,
  stepHomeSlide,
} from './homeSlides'

// specs/web/spec.md — home slides are separate routes in a looping order.
describe('homeSlides', () => {
  it('orders the slides summary, today, week', () => {
    expect(HOME_SLIDES).toEqual(['summary', 'today', 'week'])
  })

  it('accepts only known slides', () => {
    expect(isHomeSlide('today')).toBe(true)
    expect(isHomeSlide('summary')).toBe(true)
    expect(isHomeSlide('week')).toBe(true)
    expect(isHomeSlide('month')).toBe(false)
    expect(isHomeSlide(undefined)).toBe(false)
  })

  it('falls back to the first slide', () => {
    expect(resolveHomeSlide('nonsense')).toBe(DEFAULT_HOME_SLIDE)
    expect(resolveHomeSlide(null)).toBe(DEFAULT_HOME_SLIDE)
    expect(resolveHomeSlide('week')).toBe('week')
  })

  it('maps a slide to its route and back', () => {
    expect(homeSlidePath('week')).toBe('/week')
    expect(homeSlideFromPath('/summary')).toBe('summary')
    expect(homeSlideFromPath('/today')).toBe('today')
    expect(homeSlideFromPath('/week')).toBe('week')
    expect(homeSlideFromPath('/prayer-times')).toBe('summary')
    expect(homeSlideFromPath('/')).toBe('summary')
  })

  it('maps a slide to its index', () => {
    expect(homeSlideIndex('summary')).toBe(0)
    expect(homeSlideIndex('today')).toBe(1)
    expect(homeSlideIndex('week')).toBe(2)
    expect(homeSlideIndex('bad')).toBe(0)
  })

  it('wraps when stepping past either end', () => {
    expect(stepHomeSlide('summary', -1)).toBe('week')
    expect(stepHomeSlide('week', 1)).toBe('summary')
    expect(stepHomeSlide('today', 1)).toBe('week')
    expect(stepHomeSlide('today', -1)).toBe('summary')
  })
})
