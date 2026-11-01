// specs/web/spec.md — district selection survives clicks and reloads.
import { resolveDistrict, type District } from '@wsb/core'

export interface DistrictLoadResult {
  district: District
  /** The link's district until it has been used once. */
  linked: District | null
}

/**
 * Picks the district for a load. A district named in the link applies on the
 * first load only: after that the user's own choice wins, so clicking another
 * district is never undone by the address. Without a stored selection the
 * persisted choice is adopted.
 */
export function nextLoadDistrict(
  linked: District | null,
  stored: District | null,
  current: District,
  persisted: District | null,
): DistrictLoadResult {
  if (linked) return { district: resolveDistrict(linked), linked: null }
  if (!stored) {
    return { district: resolveDistrict(persisted ?? current), linked: null }
  }
  return { district: current, linked: null }
}
