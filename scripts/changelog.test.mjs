import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  compareVersions,
  isVersion,
  nextVersion,
  normalizeVersion,
  parseChangelog,
} from './changelog.mjs'

// specs/release/spec.md — version numbering and the changelog format.
describe('versions', () => {
  it('normalizes a v prefix and validates semver', () => {
    assert.equal(normalizeVersion('v4.0.0-beta.1'), '4.0.0-beta.1')
    assert.equal(isVersion('4.0.0-beta.1'), true)
    assert.equal(isVersion('4.0'), false)
    assert.equal(isVersion('nope'), false)
  })

  it('orders prereleases below their release', () => {
    assert.ok(compareVersions('4.0.0-beta.2', '4.0.0-beta.1') > 0)
    assert.ok(compareVersions('4.0.0', '4.0.0-beta.9') > 0)
    assert.ok(compareVersions('4.0.1', '4.0.0') > 0)
    assert.equal(compareVersions('4.0.0-beta.2', '4.0.0-beta.2'), 0)
  })

  it('steps the beta counter while beta, then the patch', () => {
    assert.equal(nextVersion('4.0.0-beta.1'), '4.0.0-beta.2')
    assert.equal(nextVersion('4.0.0-beta.9'), '4.0.0-beta.10')
    assert.equal(nextVersion('4.0.0'), '4.0.1')
    assert.equal(nextVersion('4.0.0', 'minor'), '4.1.0')
    assert.equal(nextVersion('4.0.0', 'major'), '5.0.0')
    assert.equal(nextVersion('4.0.0-beta.7', 'stable'), '4.0.0')
  })
})

describe('parseChangelog', () => {
  it('reads entries newest first with wrapped bullets', () => {
    const entries = parseChangelog(
      [
        '# Changelog',
        '',
        '## 4.0.0-beta.2 — 2026-11-05',
        '',
        '- Second change,',
        '  wrapped onto another line.',
        '',
        '## 4.0.0-beta.1 — 2026-11-04',
        '',
        '- First change.',
      ].join('\n'),
    )
    assert.deepEqual(entries, [
      {
        version: '4.0.0-beta.2',
        date: '2026-11-05',
        changes: ['Second change, wrapped onto another line.'],
      },
      {
        version: '4.0.0-beta.1',
        date: '2026-11-04',
        changes: ['First change.'],
      },
    ])
  })

  it('ignores prose before the first entry', () => {
    assert.deepEqual(parseChangelog('# Changelog\n\nIntro text.\n'), [])
  })
})

describe('the repository changelog', () => {
  it('matches the package version and is newest-first', () => {
    const text = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
    const entries = parseChangelog(text)
    const pkg = JSON.parse(
      readFileSync(new URL('../apps/web/package.json', import.meta.url), 'utf8'),
    )
    assert.ok(entries.length > 0)
    assert.equal(entries[0].version, pkg.version)
    for (let index = 1; index < entries.length; index += 1) {
      assert.ok(
        compareVersions(entries[index - 1].version, entries[index].version) > 0,
      )
    }
  })
})
