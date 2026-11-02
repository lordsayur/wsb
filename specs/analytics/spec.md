# Analytics — spec

- **Status:** active
- **Context:** supporting domain
- **Code:** `supabase/migrations`, `packages/data`, `apps/web` (plugin + `/admin/analytics`)
- **Depends on:** Data (same Supabase project)

## Purpose

Measure how the web app is used without a third-party tracker: which pages are
visited, in which locale and on what kind of device, and from where readers
arrive. The numbers are read back inside `/admin/analytics` so the maintainer never leaves
the app for a vendor dashboard.

## Ubiquitous language

Terms this context owns.

- **Event** — one recorded thing that happened, `pageview` in the first cut.
  Named, not free text.
- **Dimension** — an attribute of an event (`path`, `locale`, `device`,
  `referrer_host`).
- **Environment** — which deployment produced the event: `production`,
  `preview`, or `development`.
- **Session** — one browser tab's visit, identified by a random id that lives
  only in `sessionStorage` and dies with the tab.
- **Rollup** — the per-day aggregate table the dashboard reads.

## Behavior

### What is collected

- Every route change in the web shell records one `pageview` with:
  `path`, `locale`, `device`, `referrer_host`, `environment`, `session_id`,
  `occurred_at`, and a small `props` object.
- `props` carries only allowlisted keys. In the first cut: the shown `month`
  for `/prayer-times`, `range` (`month` or `year`) for `/prayer-times/graph`,
  and the selected `district`. The home's three slides (`/summary`, `/today`,
  `/week`), the monthly table and the graph are separate paths, so each is
  counted as its own page.
- The path is the route path without its query string.
- `device` is derived from the viewport width (`mobile`, `tablet`, `desktop`);
  no user-agent string is stored.
- `referrer_host` is the referring host only (no path, no query). A same-origin
  or empty referrer records no value.
- Every `/admin` route is never recorded: the insert constraint rejects it and
  the client never sends it.
- Nothing else is collected. No cookie, no IP address, no account id, no
  fingerprint, no full URL with query, no mouse or scroll data.

### When it is collected

- Only in the browser (`*.client` plugin). SSR records nothing.
- Never in development: a dev build always tags events `development`
  regardless of the configured environment, and the plugin is a no-op for that
  tag. A deliberate local test opts in with `NUXT_PUBLIC_ANALYTICS_DEV=1`.
- Never when the Supabase URL or anon key is missing.
- A page unload does not lose the event: the request uses `keepalive` and is
  fire-and-forget. A failed send is dropped, not queued or retried.

### Environment tagging

- `environment` comes from build-time configuration, not from the hostname:
  Netlify production sets `production`, Netlify deploy previews set `preview`,
  everything else defaults to `development`.
- The dashboard shows **production only** by default, with a toggle to include
  preview and development rows.

### Storage

- Events land in `public.analytics_events`. The four dimensions that need
  filtering (`day`, `event`, `path`) are indexed.
- Anonymous clients may insert and may not select, update or delete. Validation
  happens in the database, so a hostile client cannot poison the table.
- Raw events are kept for 90 days; a daily rollup (`analytics_daily`) carries
  the counts forward. Raw pruning is manual in the first cut, with the cron
  upgrade path named in the migration.

### Dashboard

- `/admin/analytics` shows the analytics dashboard to an allowlisted admin:
  totals and previous-period change, a daily views series, top pages, and
  locale/device/referrer splits, over 7, 30 or 90 days.
- The page reads through one Postgres function, `analytics_stats`, which
  re-checks the caller's email against `admin_allowlist` before returning
  anything. Authorization is never decided in the browser.
- With no rows the page shows an empty state, not an error.

## Invariants

- No personal data is stored: no IP, no cookie, no account identifier, no user
  agent, no full URL.
- An anonymous client can write an event and can never read one.
- A non-allowlisted caller gets no analytics data, whatever the client asks for.
- Development traffic never pollutes production numbers.
- `/admin` and `/admin/analytics` traffic is never recorded.
- The dashboard's default view is reproduced exactly by
  `analytics_stats(days, 'production')`.

## Acceptance criteria

- [ ] With `import.meta.dev` set, no row is written.
- [ ] With environment `development`, no row is written even in a production
      build.
- [ ] With no Supabase URL or anon key, the plugin does nothing.
- [ ] A navigation records one `pageview` with the route path and no query
      string.
- [ ] `props` contains only allowlisted keys; unknown query keys are dropped.
- [ ] `/prayer-times` and `/prayer-times/graph` are recorded as separate
      paths, so the table and the graph count apart.
- [ ] `/summary`, `/today` and `/week` are recorded as three separate home
      pages, and swiping between them records one pageview each.
- [ ] A same-origin referrer records no `referrer_host`.
- [ ] Viewport widths map to `mobile`, `tablet` and `desktop` at the
      documented breakpoints.
- [ ] A row with path `/admin` or `/admin/analytics` is rejected by the insert
      constraint.
- [ ] A row with an unknown event name or oversized `props` is rejected by the
      database.
- [ ] An anonymous client can insert a valid row.
- [ ] An anonymous client cannot select any row.
- [ ] `analytics_stats` raises for a caller with no session.
- [ ] `analytics_stats` raises for a signed-in caller absent from
      `admin_allowlist`.
- [ ] `analytics_stats` returns totals, a daily series and the three splits for
      an allowlisted caller.
- [ ] `analytics_stats` defaults to `production` and excludes other
      environments unless asked.
- [ ] After the 90-day prune, older raw rows are gone and the rollup still sums
      to the same counts.
- [ ] The account identifies a visitor without any stored identifier: there is
      none; sessions are per tab and per session only.

## Interfaces

Names only.

- `analytics_events` — one row per event (insert-only for `anon`).
- `analytics_daily` — per-day rollup (service role only).
- `analytics_stats(days int, environment text)` — `security definer` read
  function; raises unless the caller is allowlisted.
- `@wsb/data/analytics` — `AnalyticsEvent`, `AnalyticsEnvironment`,
  `deviceClass(width)`, `buildPageview(input)`.
- Web plugin `analytics.client.ts` — records `pageview` per route change.

## Out of scope

- Interaction events (share, download, install, reminders, tasbih, audio) — a
  later cut once pageview numbers are trusted.
- Bot filtering beyond a user-agent check in the client builder.
- Offline queueing and retry.
- Real-time dashboards, funnels, cohorts, session replay.
- Analytics for any shell other than `apps/web`.
- Third-party analytics — dropped in [`../legacy/parity.md`](../legacy/parity.md)
  (OPEN-4).

## Changelog

- 2026-10-24 — initial draft; Supabase-native, cookieless, pageviews first.
- 2026-10-24 — a dev build always tags `development` (not the configured
  environment), so no test build can write production rows.
- 2026-11-02 — the monthly table and the graph move to `/prayer-times` and
  `/prayer-times/graph`; props drop `view` and carry the graph's `range` there.
