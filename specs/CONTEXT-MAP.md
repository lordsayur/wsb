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

apps/web ──▶ Quran Ayat (core) ──▶ Quran corpus (static, bundled)
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

## TUI shell — presentation

- **Owns:** the full-screen terminal interface and its plain piped output.
  Rendering and platform glue only.
- **Published language:** none. It reads core state and draws it.
- **Invariant:** no business logic. Offline first, Supabase-only at runtime.
  Only the public Supabase URL + anon key ship; no service-role key, and no
  MORA calls at runtime.
- **Depends on:** Prayer Times (core) and Data.
- **Spec:** [`tui/spec.md`](./tui/spec.md).

## Quran Ayat — core domain

- **Owns:** the ayah index, the reader's scope, uniform picking, the incremental
  passage, reveal state and surah-name search.
- **Pure TypeScript.** The corpus is injected; no I/O, no DOM, no vendor types.
- **Published language:** `Ref`, `AyahRef`, `Range`, `Reveal`. See
  [`glossary.md`](./glossary.md).
- **Depends on:** nothing; the corpus is static and bundled with the app.
- **Spec:** [`quran/spec.md`](./quran/spec.md).

## Analytics — supporting domain

- **Owns:** the event vocabulary, the write path (`analytics_events`), the daily
  rollup (`analytics_daily`) and the aggregate read (`analytics_stats`).
- **Published language:** `AnalyticsEvent`, `AnalyticsEnvironment`,
  `deviceClass(width)`, `buildPageview(input)`. See
  [`analytics/spec.md`](./analytics/spec.md).
- **Invariant:** the browser can only write; only an allowlisted admin can read,
  and authorization is decided in the database, never in the shell.
- **Depends on:** Data (same Supabase project, same allowlist).
- **Spec:** [`analytics/spec.md`](./analytics/spec.md).

## Dependency rules

- Shell → core → data-port. Never the reverse.
- Core never imports from a shell or an adapter.
- `packages/shared` is not a context; it is being split into core and data.

## Notifications — supporting domain

- **Owns:** the announcement vocabulary, the pure selection rules (active,
  sort, version notices, unread), and the `announcements` table read path.
- **Published language:** `Announcement`, `AnnouncementMessages`,
  `AnnouncementInput`, `validateAnnouncement`, `announcementText`,
  `activeAnnouncements`, `versionNotices`, `unreadCount`. See
  [`notifications/spec.md`](./notifications/spec.md).
- **Invariant:** the browser can only read; publishing and deleting go through
  the `admin` Edge Function, which re-checks the allowlist.
- **Depends on:** Data (same Supabase project), Release (version notices).

## Feedback — supporting domain

- **Owns:** the feedback payload, its validation, and how it becomes a GitHub
  issue. See [`feedback/spec.md`](./feedback/spec.md).
- **Published language:** `FeedbackInput`, `validateFeedback`, `issueContent`,
  `issueLink`.
- **Invariant:** the reader needs no account; the maintainer's GitHub token stays
  on the server.
- **Depends on:** Release (the version stamped on an issue), Web (the route).
