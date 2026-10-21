# Context map

How the bounded contexts relate. Derived from `VISION.md` ("thin shell, thick
core"). Arrows are dependencies: the left depends on the right.

```
apps/web ───────┐
                │
apps/extension ─┤
                ├──▶ packages/core ──▶ packages/data (port)
apps/vscode ────┤      (core domain)        ▲
apps/raycast ───┘                           │ implements
                     Supabase adapter (runtime) + MORA import (manual)
```

## Prayer Times — core domain

- **Owns:** districts, per-district offsets, time math, selection rules,
  formatting, the selection-persistence *contract*.
- **Pure TypeScript.** No DOM, no network, no Supabase, no framework.
- **Published language:** `District`, `PrayerName`, `PrayerTimes`, `Selection`.
  See [`glossary.md`](./glossary.md).
- **Depends on:** Data (through its port only).

## Data — supporting domain

- **Owns:** the storage/backend abstraction and its adapters.
- **Published language:** the port interface (read/refresh cached prayer data,
  persist selection). Types are backend-agnostic.
- **Invariant:** no Supabase (or any vendor) type crosses the port into core or
  shells. Adapters translate at the boundary.
- **Depends on:** nothing in core.

## Web shell — presentation

- **Owns:** rendering and platform glue only. Atomic-design components.
- **Published language:** none. It reads core state and draws it.
- **Invariant:** no business logic. If a rule lives here, it belongs in core.
- **Depends on:** Prayer Times (core) and Data.

## Extension shell — presentation

- **Owns:** the toolbar popup, on-page header injection, and the browser
  notification glue. Rendering and platform glue only.
- **Published language:** none. It reads core state and draws it.
- **Invariant:** no business logic; the reminder schedule comes from core.
  Offline first, Supabase-only at runtime. Only the public Supabase URL + anon
  key ship; no service-role key, and no MORA calls at runtime.
- **Depends on:** Prayer Times (core) and Data.
- **Spec:** [`extension/spec.md`](./extension/spec.md).

## VS Code shell — presentation

- **Owns:** the status bar item and the times-panel webview. Rendering and
  platform glue only.
- **Published language:** none. It reads core state and draws it.
- **Invariant:** no business logic. Offline first, Supabase-only at runtime.
  Only the public Supabase URL + anon key ship; no service-role key, and no
  MORA calls at runtime.
- **Depends on:** Prayer Times (core) and Data.
- **Spec:** [`vscode/spec.md`](./vscode/spec.md).

## Raycast shell — presentation

- **Owns:** the prayer-times command in the launcher. Rendering and platform
  glue only.
- **Published language:** none. It reads core state and draws it.
- **Invariant:** no business logic. Offline first, Supabase-only at runtime.
  Only the public Supabase URL + anon key ship; no service-role key, and no
  MORA calls at runtime.
- **Depends on:** Prayer Times (core) and Data.
- **Spec:** [`raycast/spec.md`](./raycast/spec.md).

## Dependency rules

- Shell → core → data-port. Never the reverse.
- Core never imports from a shell or an adapter.
- `packages/shared` is not a context; it is being split into core and data.
