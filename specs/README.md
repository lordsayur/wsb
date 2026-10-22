# Specs

Spec-driven development (SDD) for `wsb`. The spec is the source of truth; code
is a rendering of it. When the app grows, you read and edit the spec first, then
make the code match.

## Why

`VISION.md` says *what* and *why*. Specs say *how each bounded context behaves*,
in a form both humans and agents can check against. One spec per bounded
context, updated in the same change that touches its behavior.

## Bounded contexts (DDD)

This repo is split by domain, not by layer. Each context owns its model and its
language; see [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) for how they relate.

| Context | Code | Spec |
| --- | --- | --- |
| Prayer Times (core domain) | `packages/core` | [`core/spec.md`](./core/spec.md) |
| Data (port + adapters) | `packages/data` | [`data/spec.md`](./data/spec.md) |
| Web shell | `apps/web` | [`web/spec.md`](./web/spec.md) |
| Extension shell | `apps/extension` | [`extension/spec.md`](./extension/spec.md) |
| VS Code shell | `apps/vscode` | [`vscode/spec.md`](./vscode/spec.md) |
| Raycast shell | `apps/raycast` | [`raycast/spec.md`](./raycast/spec.md) |
| TUI shell | `apps/tui` | [`tui/spec.md`](./tui/spec.md) |
| Testing (cross-cutting) | all | [`testing/spec.md`](./testing/spec.md) |

`packages/shared` is not a context. It is a placeholder being split into `core`
and `data`; do not add domain logic to it.

## Workflow

1. **Read the spec** for the context you touch, plus the glossary and context
   map.
2. **Check the legacy parity list** ([`legacy/parity.md`](./legacy/parity.md))
   when the behavior exists in the old app. It records every legacy rule as
   adopt / override / drop, so nothing important is silently lost.
3. **Change the spec first** when behavior changes: update the relevant section,
   bump Status, add a Changelog line.
4. **Make the code match.** A behavior change with no spec change is a bug.
5. **Test from the spec.** Acceptance criteria are the test list.
6. **New context?** Copy [`templates/context-spec.md`](./templates/context-spec.md),
   add a row to the table above and to the context map, then code it.

## Legacy migration

`specs/legacy/` holds the old app's bundled rules, for reference only:

- [`legacy/business-rules.md`](./legacy/business-rules.md) — the legacy v3.0.0
  rules and Firestore contract, verbatim.
- [`legacy/parity.md`](./legacy/parity.md) — the checklist: each legacy rule
  marked **adopt**, **override**, or **drop**, with its new home and open
  decisions.

These are inputs, not authority. If a legacy rule conflicts with a context
spec, the context spec wins and the parity list must say so.


## Rules

- One spec per bounded context. Never fork language across specs — define a
  term once in [`glossary.md`](./glossary.md) and link to it.
- Specs describe behavior and invariants, not class names. Implementation may
  move; the domain contract may not.
- Every acceptance criterion is testable. If it can't fail, it isn't a
  criterion.
- Keep specs short. Delete what no longer holds; a stale spec is worse than none.
- Mark unresolved decisions `OPEN:` inline; resolve before shipping the
  behavior they gate.

## Status values

`draft` → `active` → `deprecated`. Only `active` specs may be implemented.
