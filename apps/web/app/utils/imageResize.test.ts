import { describe, expect, it } from 'vitest'
import { UPLOAD_MAX_EDGE, fitWithin } from './imageResize'

// specs/feedback/spec.md — screenshot scaling before upload.
describe('fitWithin', () => {
  it('leaves an image that already fits alone', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })

  it('scales the longest edge down and keeps the aspect ratio', () => {
    expect(fitWithin(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 })
    expect(fitWithin(1000, 4000, 1600)).toEqual({ width: 400, height: 1600 })
  })

  it('never produces a zero dimension', () => {
    const size = fitWithin(10_000, 5, 1600)
    expect(size.width).toBe(1600)
    expect(size.height).toBe(1)
  })

  it('defaults to the upload edge', () => {
    expect(fitWithin(UPLOAD_MAX_EDGE * 2, 100).width).toBe(UPLOAD_MAX_EDGE)
  })
})
