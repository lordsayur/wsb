import { describe, expect, it } from 'vitest'
import { nextLoadDistrict } from './districtLoad'

// specs/web/spec.md — a link's district applies once; the user's choice wins.
describe('nextLoadDistrict', () => {
  it('applies the linked district on the first load only', () => {
    expect(
      nextLoadDistrict('belait', null, 'bruneiMuara', null),
    ).toEqual({ district: 'belait', linked: null })
  })

  it('keeps the clicked district on later loads', () => {
    // The user clicked Tutong; a stale link must not snap it back to Belait.
    expect(nextLoadDistrict(null, 'belait', 'tutong', null)).toEqual({
      district: 'tutong',
      linked: null,
    })
  })

  it('adopts the persisted choice when nothing is stored in this session', () => {
    expect(
      nextLoadDistrict(null, null, 'bruneiMuara', 'tutong'),
    ).toEqual({ district: 'tutong', linked: null })
  })

  it('falls back to the current district when nothing is persisted', () => {
    expect(nextLoadDistrict(null, null, 'tutong', null)).toEqual({
      district: 'tutong',
      linked: null,
    })
  })

  it('resolves unknown values safely', () => {
    expect(
      nextLoadDistrict(null, null, 'bruneiMuara', 'temburong' as never),
    ).toEqual({ district: 'bruneiMuara', linked: null })
  })
})
