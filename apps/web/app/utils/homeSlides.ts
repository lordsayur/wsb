// specs/web/spec.md — the home carousel's pages. Each slide is its own route so
// analytics counts it apart; the order is the swipe order, and it loops.
export const HOME_SLIDES = ['summary', 'today', 'week'] as const

export type HomeSlide = (typeof HOME_SLIDES)[number]

export const DEFAULT_HOME_SLIDE: HomeSlide = 'summary'

/** Cookie that remembers the last slide the reader was on. */
export const HOME_SLIDE_COOKIE = 'wsb.homeSlide'

const HOME_SLIDE_PATHS: Readonly<Record<HomeSlide, string>> = {
  summary: '/summary',
  today: '/today',
  week: '/week',
}

export function isHomeSlide(value: unknown): value is HomeSlide {
  return (
    typeof value === 'string' && (HOME_SLIDES as readonly string[]).includes(value)
  )
}

export function resolveHomeSlide(value: unknown): HomeSlide {
  return isHomeSlide(value) ? value : DEFAULT_HOME_SLIDE
}

export function homeSlidePath(slide: HomeSlide): string {
  return HOME_SLIDE_PATHS[slide]
}

/**
 * The slide a route path shows. Anything else (a stray path, the `/` redirect)
 * falls back to the first slide, the summary.
 */
export function homeSlideFromPath(path: string): HomeSlide {
  const found = HOME_SLIDES.find((slide) => HOME_SLIDE_PATHS[slide] === path)
  return found ?? DEFAULT_HOME_SLIDE
}

/** Index of a slide in the swipe order; a bad value falls back to the default. */
export function homeSlideIndex(value: unknown): number {
  return HOME_SLIDES.indexOf(resolveHomeSlide(value))
}

/** Moves through the slides, wrapping at both ends. */
export function stepHomeSlide(value: unknown, delta: number): HomeSlide {
  const length = HOME_SLIDES.length
  const from = homeSlideIndex(value)
  return HOME_SLIDES[(((from + delta) % length) + length) % length]!
}
