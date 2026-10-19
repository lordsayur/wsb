# Data — spec

- **Status:** active
- **Context:** supporting domain
- **Code:** `packages/data` (does not exist yet; currently `packages/shared`)
- **Depends on:** nothing in core

## Purpose

Define the backend-agnostic port through which core reads prayer data and
persists the user's district selection, plus the adapters that implement it.
Supabase is the first adapter, not the definition.

## Ubiquitous language

See [`../glossary.md`](../glossary.md). Owned terms: *Data port*, *Refresh*.

## Behavior

### Offline first

- Every shell (web PWA, browser extension, future CLI/TUI/editor shells) reads
  through the same port and is **offline first**: the device cache is the source
  of truth for rendering and is consulted before any network call.
- Supabase is the **only runtime remote source**. MORA is never contacted by a
  shell at runtime.

### Read

- When core requests prayer data for a date + district, return the device cache
  if present, else fetch via the Supabase adapter and cache it.
- The returned day includes the source's Hijri date for that day; it is stored
  and returned with the entries.
- A month read returns one entry per cached or fetched day for a `YYYY-MM`
  month; cached days are used first and missing days are fetched. Days the
  source cannot supply are omitted; the result is marked *stale* when any day
  in the month is missing. With no cached days and no network the month read is
  *unavailable*.
- When the network fails, return the last known good data; never throw to core.
- When no data exists at all (first run, offline), signal *unavailable*
  explicitly so the shell can render an empty state.
- When a shell has no Supabase configuration, reads behave as unavailable; there
  is no fake or direct-MORA fallback in production.

### Refresh

- A refresh updates cached data but never blocks rendering.
- A failed refresh leaves the previous cache intact.

### Selection persistence

- Store and retrieve the selection per the core contract.
- An unknown or corrupt stored value reads back as "no selection".
- Selection is durable across reloads on the same device; the shell supplies the
  device-backed `SelectionStore` (localStorage), the adapter only uses the port.

### Port boundary

- The port exposes only backend-agnostic types. No Supabase (or other vendor)
  type may appear in its signature.
- Adapters translate vendor rows/documents to port types at the boundary.

### Device cache

- The durable cache is a shell-supplied `PrayerCacheStore` (web: `localStorage`;
  extension: `chrome.storage.local`), keyed by date + district, with one
  last-known-day key per district.
- Cached entries are validated on read; corrupt values are ignored and refetched.
  The cache key carries a schema version, so days written before the entry set
  changed (for example before Dhuha or Imsak existed) are abandoned, not
  rendered with a missing row.
- The extension embeds only the **public** Supabase URL and anon key at build
  time; no service-role key ever ships.

### MORA import (one Brunei month at a time)

- MORA is an **import-time** source only: it is never contacted by a shell at
  runtime. The import runs both as the CLI (`pnpm import:mora`) and as the
  Supabase Edge Function `admin` invoked by the web `/admin` page after an
  authorized sign-in.
- The importer pulls exactly one Brunei calendar month and upserts it into
  Supabase. It targets the current Brunei month by default; `--month YYYY-MM`
  (CLI) or `{ month: "YYYY-MM" }` (function) selects another.
- `--dry-run` fetches without writing; `--sql` prints a seed.
- The Edge Function holds the service-role key as a Supabase secret; the key
  never reaches the browser.

### MORA source

- Prayer times originate from the MORA/KHEU Brunei page at
  `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` (the public canonical
  host; `mora-prod.cwh.gov.bn` is internal and unreachable from browsers).
- The page's data is a SharePoint list read through its REST API; the adapter
  requests one range at a time and requests `Accept: application/json;odata=nometadata`.
- The source stores eight entries per day: Imsak, Suboh, Syuruk, Doha, Zohor,
  Asar, Maghrib, Isyak. Core exposes all eight it renders, Imsak included.
- Times arrive as `h.mm` with a 12-hour clock and no am/pm marker. The adapter
  normalizes them to 24-hour `HH:mm:ss` using the prayer's position in the day
  (Asar, Maghrib, Isyak are PM; Zohor is 12:xx; morning entries are AM).
- The SharePoint `Date` field is Brunei local midnight stored as UTC (16:00Z on
  the previous day). The adapter converts it to the Brunei calendar date.
- **One record = one prayer time**: rows are keyed by
  (prayer date, district, prayer), so a future data-analysis surface can query
  individual times. Stored district is the base district (Brunei & Muara);
  offsets stay in core.
- The importer fetches exactly one Brunei calendar month and upserts into
  Supabase. Run it monthly.
- Credentials are environment-only: `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` for the CLI importer and the `admin` Edge
  Function (as function secrets); the web shell uses
  `NUXT_PUBLIC_SUPABASE_URL` + `NUXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role
  key never ships to a shell.
- Supabase migration: `supabase/migrations/20261018000000_prayer_times.sql`.
  Public read via RLS; writes only through the service role.

### Admin import and correction

- The admin surface is the only way to write prayer data other than the CLI.
  It is reachable only from the web `/admin` page.
- Access requires a Google sign-in through Supabase Auth **and** a matching row
  in `admin_allowlist` (`email`). The allowlist is checked server-side on every
  call; the client never decides authorization.
- A signed-in user who is not allowlisted is rejected with *forbidden*; the page
  shows an "not authorized" state and exposes no data.
- An allowlisted admin can:
  - import one Brunei month (current or a chosen `YYYY-MM`) from MORA, and
  - edit an existing record's time for a (date, district, prayer) and upsert it.
- Edits are upserts keyed by (prayer date, district, prayer) and stamp
  `updated_at`; importing a month overwrites matching rows.
- An edit must carry a valid ISO date, a known district, a known prayer and a
  `HH:mm` or `HH:mm:ss` time; anything else is rejected without writing.
- After a successful import or edit the shells' next refresh picks up the change;
  no runtime shell is notified directly.

## Invariants

- Core and shells never import an adapter directly; they import the port.
- A refresh failure cannot delete or corrupt valid cached data.
- The port never exposes vendor types.

## Acceptance criteria

- [ ] Reading with an empty cache and no network returns *unavailable*, not an
      exception.
- [ ] Reading with a populated cache returns it even when offline.
- [ ] A cached day is served across repository instances without a network call.
- [ ] A new day with only an older cached day returns that day, marked stale.
- [ ] A corrupt cache entry is ignored and refetched.
- [ ] A cache entry written under an older schema version is not rendered; the
      day is refetched.
- [ ] A failed refresh leaves the previous cached data readable.
- [ ] Storing then reading a selection round-trips the same district.
- [ ] A corrupt stored selection reads back as no selection.
- [ ] No Supabase (or other vendor) type is referenced in the port's public
      signatures.
- [ ] The importer writes one row per prayer time for one Brunei month
      (current by default, `--month` otherwise).
- [ ] A stored row reads back as the correct 24-hour prayer time.
- [ ] Reading a day returns the Hijri date stored with its rows.
- [ ] Reading one month returns its cached days and fetches the missing ones.
- [ ] Reading a month offline with a partial cache returns those days, marked
      stale.
- [ ] Reading a month with no cache and no network returns *unavailable*.
- [ ] A SharePoint UTC date maps to the correct Brunei calendar date.
- [ ] The `admin` function rejects a caller with no session or a session whose
      email is not in `admin_allowlist`, without reading or writing data.
- [ ] An allowlisted admin import of one month upserts one row per prayer time.
- [ ] An allowlisted admin edit updates exactly one (date, district, prayer)
      row and leaves the others untouched.
- [ ] An edit with an invalid date, district, prayer or time is rejected without
      writing.

## Interfaces

Names only.

- `PrayerRepository` (port): read(date, district), readMonth(month, district),
  refresh(), getSelection(), setSelection().
- Adapter implementing the port against Supabase (Postgres via `@supabase/supabase-js`).
- `admin` Edge Function (`supabase/functions/admin`): authenticated
  `POST` with `action` of `import`, `update` or `list`.
- Allowlist table `public.admin_allowlist(email)`; writable by the service role
  only.

## Out of scope

- Offset/time rules — core.
- UI states beyond the *unavailable* signal — shell.
- Admin account management (adding/removing allowlisted emails) — done in the
  Supabase dashboard for now.

## Changelog

- 2026-10-04 — initial draft, extracted from `VISION.md`.
- 2026-10-18 — backend plan switched from Firestore to Supabase; legacy data
  contract to be modelled as Postgres tables/views behind the port. Legacy shape
  and dispositions: [`../legacy/parity.md`](../legacy/parity.md) §4.
- 2026-10-18 — MORA/KHEU source adapter, one row per prayer time, importer for
  current month → year end.
- 2026-10-18 — expose the day's Hijri date through the port.
- 2026-10-18 — offline first everywhere; Supabase is the only runtime source;
  MORA import is monthly and manual; durable shell-supplied cache.
- 2026-10-19 — add the authenticated `admin` Edge Function (one-month MORA
  import, record correction) gated by a Google-signed-in allowlist; the CLI
  importer remains.
- 2026-10-19 — add a month read (`readMonth`) to the port; Dhuha is exposed to
  core.
- 2026-10-20 — version the day cache key so pre-Dhuha entries are refetched.
- 2026-10-20 — expose Imsak to core; version the day cache key (v3) so days
  cached without Imsak are refetched.
