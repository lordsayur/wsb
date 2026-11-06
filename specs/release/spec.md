# Release — spec

- **Status:** active
- **Context:** cross-cutting (not a bounded context)
- **Code:** `apps/web/package.json`, `CHANGELOG.md`, `apps/web/app/data/changelog.json`, `scripts/version.mjs`, `scripts/changelog.mjs`
- **Depends on:** Web, Data, Notifications

## Purpose

Give the product one version number and one changelog that the app, CI and a
reader can all agree on. Every push to `main` is a new build, so every push
carries a new version and its own changelog entry.

## Ubiquitous language

- **App version** — the semantic version of the web shell, the only version the
  product shows. During beta it is a prerelease of the coming stable release.
- **Changelog** — the newest-first list of app versions, each with its date and
  the changes shipped in it.
- **Version notice** — a notification the app raises when the version it is
  running is newer than the last version this device acknowledged.

## Behavior

### Numbering

- The next stable release is **4.0.0**. Until it ships, builds are
  `4.0.0-beta.N`: the beta counter starts at 1 and increments once per push to
  `main`.
- Once stable, the version is `4.0.0` and later pushes increment the patch by
  default (`4.0.1`, `4.0.2`, …).
- A push that changes behavior in a compatible way may bump the minor instead
  (`4.1.0`); an incompatible change bumps the major (`5.0.0`).
- `--stable` drops the beta suffix without changing the core numbers
  (`4.0.0-beta.7` → `4.0.0`).

### One record, three files

- `apps/web/package.json` holds the app version.
- `CHANGELOG.md` holds the human record, newest first, one `## <version> —
  <date>` heading per version and one bullet per change.
- `apps/web/app/data/changelog.json` is the same record bundled for the app,
  with the same version and entries.
- `pnpm version:bump` writes all three in one step: the next version, a new
  dated changelog entry, and the JSON bundle.
- `pnpm version:validate` fails unless the top changelog entry, the package
  version and the JSON bundle agree, entries are newest-first, and every entry
  has at least one change.
- `pnpm version:check` additionally fails when the pushed range did not change
  the package version and `CHANGELOG.md`. The range is `HEAD^..HEAD` locally
  and the push's `before..HEAD` in CI, where the commit that opens a new branch
  is exempt. A commit message containing `[skip version]` is exempt, for
  changes that do not alter the app.

### Where it is shown

- `/about` shows the app version, the beta marker while the version is a
  prerelease, links to the changelog, the notifications page, the other
  platforms and the privacy page, credits the data source, and states what the
  app is.
- `/changelog` renders every changelog entry, newest first, with the running
  version marked.

## Invariants

- The version the app renders is the version in the bundled changelog.
- No version number is hard-coded in a component.
- A changelog entry is never rewritten after it ships; a correction gets its own
  entry.

## Acceptance criteria

- [ ] The package version, the top changelog heading and the bundled JSON agree.
- [ ] A push without a version bump and a changelog change fails the check.
  A `[skip version]` commit passes without either.
- [ ] `--stable` turns `4.0.0-beta.N` into `4.0.0` and later bumps the patch.
- [ ] `/about` shows the running version; a prerelease version is marked beta.
- [ ] `/changelog` lists entries newest-first and marks the running version.

## Interfaces

- `scripts/changelog.mjs`: `normalizeVersion`, `isVersion`, `versionKey`,
  `compareVersions`, `parseChangelog`, `nextVersion`.
- `apps/web/app/data/changelog.json`: `{ version, entries: [{ version, date,
  changes }] }`.

## Out of scope

- Platform-shell versions (extension, TUI, VS Code, Raycast) — each ships from
  its own manifest and release.
- Publishing releases — a `v*` tag still drives the artifact workflow.

## Changelog

- 2026-11-04 — initial draft: beta numbering, three-file record, About and
  changelog pages.
