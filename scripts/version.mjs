#!/usr/bin/env node
// specs/release/spec.md — one app version, one changelog, three files.
// `apps/web/package.json` is the version the app shows, `CHANGELOG.md` is the
// human record, and `apps/web/app/data/changelog.json` is that same record
// bundled for the app. `bump` writes all three, `validate` proves they agree,
// and `check` rejects a push that skipped the bump.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  compareVersions,
  isVersion,
  nextVersion,
  parseChangelog,
} from './changelog.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(root, 'apps/web/package.json')
const logPath = join(root, 'CHANGELOG.md')
const dataPath = join(root, 'apps/web/app/data/changelog.json')

function fail(message) {
  console.error(`version: ${message}`)
  process.exit(1)
}

function readPackage() {
  return JSON.parse(readFileSync(pkgPath, 'utf8'))
}

function readVersion() {
  return readPackage().version
}

function readData() {
  try {
    return JSON.parse(readFileSync(dataPath, 'utf8'))
  } catch {
    return null
  }
}

function writeData(version, entries) {
  writeFileSync(dataPath, `${JSON.stringify({ version, entries }, null, 2)}\n`)
}

function readEntries() {
  return parseChangelog(readFileSync(logPath, 'utf8'))
}

function validate() {
  const version = readVersion()
  if (!isVersion(version)) fail(`"${version}" is not a semantic version`)

  const entries = readEntries()
  if (entries.length === 0) fail('CHANGELOG.md has no entries')
  if (entries[0].version !== version) {
    fail(
      `top changelog entry is ${entries[0].version}, package version is ${version}`,
    )
  }
  for (const entry of entries) {
    if (!isVersion(entry.version)) fail(`bad changelog version "${entry.version}"`)
    if (entry.changes.length === 0) fail(`changelog ${entry.version} has no changes`)
  }
  for (let index = 1; index < entries.length; index += 1) {
    if (compareVersions(entries[index - 1].version, entries[index].version) <= 0) {
      fail(`changelog is not newest-first at ${entries[index].version}`)
    }
  }

  const data = readData()
  if (!data) {
    fail('apps/web/app/data/changelog.json is missing; run `pnpm version:bump`')
  }
  if (data.version !== version) {
    fail(`changelog.json says ${data.version}, package version is ${version}`)
  }
  if (JSON.stringify(data.entries) !== JSON.stringify(entries)) {
    fail('changelog.json is stale; run `pnpm version:sync`')
  }

  console.log(
    `version: ${version} is consistent with CHANGELOG.md and changelog.json`,
  )
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
}

function check() {
  validate()
  let message = ''
  try {
    message = git(['log', '-1', '--pretty=%B'])
  } catch {
    return
  }
  if (message.includes('[skip version]')) {
    console.log('version: [skip version] found, bump not required')
    return
  }

  // CI passes the pushed range; locally compare against the parent commit.
  const range = process.env.VERSION_CHECK_RANGE || 'HEAD^..HEAD'
  const [base] = range.split('..')
  if (/^0+$/.test(base ?? '')) {
    // A new branch has no previous commit to compare against.
    console.log('version: new branch, bump not checked')
    return
  }
  let files
  try {
    files = git(['diff', '--name-only', range]).split('\n').filter(Boolean)
  } catch {
    console.log('version: no parent commit, bump not checked')
    return
  }
  const missing = ['apps/web/package.json', 'CHANGELOG.md'].filter(
    (file) => !files.includes(file),
  )
  if (missing.length > 0) {
    fail(
      `commit must bump the version and add a changelog entry (missing: ${missing.join(', ')})`,
    )
  }
  console.log('version: bump and changelog entry present')
}

function sync() {
  const version = readVersion()
  writeData(version, readEntries())
  console.log(`version: changelog.json regenerated for ${version}`)
}

function bump(kind, note) {
  const current = readVersion()
  if (!isVersion(current)) fail(`"${current}" is not a semantic version`)
  const version = nextVersion(current, kind)
  // Local date, so an evening commit is not dated yesterday.
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const pkg = readPackage()
  pkg.version = version
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

  const text = readFileSync(logPath, 'utf8')
  const entry = [
    `## ${version} — ${date}`,
    '',
    `- ${note || 'TODO: describe this change.'}`,
    '',
    '',
  ].join('\n')
  const marker = text.search(/^## /m)
  const next =
    marker === -1
      ? `${text.trimEnd()}\n\n${entry}`
      : `${text.slice(0, marker)}${entry}${text.slice(marker)}`
  writeFileSync(logPath, next)

  writeData(version, parseChangelog(next))
  console.log(`version: ${current} -> ${version}`)
}

const [command, ...args] = process.argv.slice(2)
const kind = ['major', 'minor', 'patch', 'stable'].find((value) =>
  args.includes(`--${value}`),
)
const noteIndex = args.indexOf('--note')
const note = noteIndex === -1 ? '' : (args[noteIndex + 1] ?? '')

if (command === 'validate') validate()
else if (command === 'check') check()
else if (command === 'sync') sync()
else if (command === 'bump') bump(kind, note)
else {
  fail(
    'usage: version.mjs <validate|sync|check|bump> [--major|--minor|--patch|--stable] [--note "text"]',
  )
}
