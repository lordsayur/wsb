# <Context name> — spec

- **Status:** draft
- **Context:** <core domain | supporting domain | presentation>
- **Code:** `packages/<name>` or `apps/<name>`
- **Depends on:** <contexts>

## Purpose

One paragraph. What this context is for, in domain language.

## Ubiquitous language

Terms this context owns or uses. Link to [`../glossary.md`](../glossary.md);
define context-local terms here.

## Behavior

The rules and flows. Imperative, testable statements. Cover happy path, edge
cases, and failure modes.

- When <condition>, the system <does X>.
- If <bad input>, the system <does Y> and never <Z>.

## Invariants

Facts that must always hold. A violation is a bug, not an edge case.

- <Invariant 1>
- <Invariant 2>

## Acceptance criteria

Each line is a test. If it can't fail, it isn't a criterion.

- [ ] <Given/When/Then or a single verifiable claim>
- [ ] <...>

## Interfaces

Published types/functions other contexts may depend on. Names + shapes, not
implementations.

## Out of scope

What this context deliberately does not do (and where it belongs).

## Changelog

- YYYY-MM-DD — initial draft.
