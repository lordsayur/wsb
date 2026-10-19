# Testing — spec

- **Status:** active
- **Context:** cross-cutting (not a bounded context)
- **Code:** `packages/core`, `packages/data`, `apps/web`
- **Depends on:** Core, Data, Web specs

## Purpose

Make the acceptance criteria in the context specs executable, and make
components testable without booting Nuxt. TDD applies to core; stories are the
component tests.

## Behavior

### Unit tests

- Domain logic (core) and the data port are tested with Vitest in node.
- Tests reference the spec they cover.
- Core is written test-first.

### Component tests (Storybook)

- Every atom, molecule and organism has a co-located `*.stories.ts`.
- Stories cover default, loading, error and edge states.
- Interactive stories use a `play` function with `userEvent`, `expect` and `fn`.
- Stories run headless in Chromium via Vitest browser mode and
  `@storybook/experimental-addon-test`.
- `pnpm test` runs unit + story suites; a failing story fails the suite.
- Components must not depend on the Nuxt runtime. Shell dependencies are
  injected; stories provide fakes.

## Invariants

- No story reaches the network.
- A component without stories is unfinished.
- A behavior change without a spec and test change is a bug.

## Acceptance criteria

- [x] `pnpm test` runs core, data, and the web unit + story suites.
- [x] Selecting Belait in the app yields +3 minutes on every entry.
- [x] A story asserts the district selector emits a selection.
- [x] A story asserts the six rows render in order.
- [x] A story asserts the offline state renders with cached rows.
- [ ] CI runs typecheck, tests (including stories) and build on every PR.

## Changelog

- 2026-10-18 — initial, pipeline-first.
