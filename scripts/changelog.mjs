// specs/web/spec.md — the changelog reader shared by the build and the bump
// script. One parser, so the app and the check can never disagree.

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/
const HEADING = /^##\s+(\S+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/

/** `v4.0.0-beta.1` -> `4.0.0-beta.1`; anything else unchanged. */
export function normalizeVersion(value) {
  return String(value ?? '').trim().replace(/^v/, '')
}

export function isVersion(value) {
  return SEMVER.test(normalizeVersion(value))
}

/**
 * Comparable key: [major, minor, patch, release] plus prerelease parts. A
 * prerelease sorts below its release, so `4.0.0-beta.2` < `4.0.0`.
 */
export function versionKey(value) {
  const match = SEMVER.exec(normalizeVersion(value))
  if (!match) return null
  const core = [Number(match[1]), Number(match[2]), Number(match[3])]
  if (!match[4]) return { core, release: 1, parts: [] }
  return {
    core,
    release: 0,
    parts: match[4].split('.').map((part) =>
      /^\d+$/.test(part) ? Number(part) : part,
    ),
  }
}

/** Positive when `left` is newer than `right`; 0 when equal or unparsable. */
export function compareVersions(left, right) {
  const a = versionKey(left)
  const b = versionKey(right)
  if (!a || !b) return 0
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) {
      return a.core[index] > b.core[index] ? 1 : -1
    }
  }
  if (a.release !== b.release) return a.release > b.release ? 1 : -1
  if (a.release === 1) return 0
  const length = Math.max(a.parts.length, b.parts.length)
  for (let index = 0; index < length; index += 1) {
    const l = a.parts[index]
    const r = b.parts[index]
    if (l === undefined) return -1
    if (r === undefined) return 1
    if (l === r) continue
    if (typeof l === 'number' && typeof r === 'number') return l > r ? 1 : -1
    return String(l) > String(r) ? 1 : -1
  }
  return 0
}

/** Splits a changelog into its entries, newest first. */
export function parseChangelog(text) {
  const entries = []
  let current = null
  let last = null
  for (const line of String(text ?? '').split('\n')) {
    const heading = HEADING.exec(line.trim())
    if (heading) {
      current = {
        version: normalizeVersion(heading[1]),
        date: heading[2],
        changes: [],
      }
      entries.push(current)
      last = null
      continue
    }
    if (!current) continue
    if (/^\s*[-*]\s+\S/.test(line)) {
      last = line.trim().slice(2).trim()
      current.changes.push(last)
      continue
    }
    // A wrapped bullet continues on the following indented lines.
    if (last && line.trim() && /^\s+/.test(line)) {
      const joined = `${last} ${line.trim()}`
      current.changes[current.changes.length - 1] = joined
      last = joined
      continue
    }
    if (!line.trim()) last = null
  }
  return entries
}

/** The next version for a bump kind. Beta builds step their beta number. */
export function nextVersion(current, kind = 'patch') {
  const value = normalizeVersion(current)
  const match = SEMVER.exec(value)
  if (!match) throw new Error(`"${current}" is not a semantic version`)
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  const prerelease = match[4]

  if (kind === 'major') return `${major + 1}.0.0`
  if (kind === 'minor') return `${major}.${minor + 1}.0`
  if (kind === 'stable') return `${major}.${minor}.${patch}`
  if (!prerelease) return `${major}.${minor}.${patch + 1}`

  const parts = prerelease.split('.')
  const last = parts.at(-1)
  parts[parts.length - 1] = /^\d+$/.test(last)
    ? String(Number(last) + 1)
    : `${last}.1`
  return `${major}.${minor}.${patch}-${parts.join('.')}`
}
