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
- The extension embeds only the **public** Supabase URL and anon key at build
  time; no service-role key ever ships.

### MORA import (manual, monthly)

- MORA is an **import-time** source only: a manual script pulls one Brunei
  calendar month and upserts it into Supabase. It is not part of any shell.
- The importer targets the current Brunei month by default; `--month YYYY-MM`
  selects another, `--dry-run` fetches without writing, `--sql` prints a seed.

### MORA source

- Prayer times originate from the MORA/KHEU Brunei page at
  `https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` (the public canonical
  host; `mora-prod.cwh.gov.bn` is internal and unreachable from browsers).
- The page's data is a SharePoint list read through its REST API; the adapter
  requests one range at a time and requests `Accept: application/json;odata=nometadata`.
- The source stores eight entries per day: Imsak, Suboh, Syuruk, Doha, Zohor,
  Asar, Maghrib, Isyak. Core exposes the six it needs; imsak and doha are kept
  in storage for future analysis.
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
  Supabase. Run it monthly, manually.
- Credentials are environment-only: `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` for the importer; the web shell uses
  `NUXT_PUBLIC_SUPABASE_URL` + `NUXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role
  key never ships to a shell.
- Supabase migration: `supabase/migrations/20261018000000_prayer_times.sql`.
  Public read via RLS; writes only through the service role.

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
- [ ] A failed refresh leaves the previous cached data readable.
- [ ] Storing then reading a selection round-trips the same district.
- [ ] A corrupt stored selection reads back as no selection.
- [ ] No Supabase (or other vendor) type is referenced in the port's public
      signatures.
- [ ] The importer writes one row per prayer time for one Brunei month
      (current by default, `--month` otherwise).
- [ ] A stored row reads back as the correct 24-hour prayer time.
- [ ] Reading a day returns the Hijri date stored with its rows.
- [ ] A SharePoint UTC date maps to the correct Brunei calendar date.

## Interfaces

Names only.

- `PrayerRepository` (port): read(date, district), refresh(), getSelection(),
  setSelection().
- Adapter implementing the port against Supabase (Postgres via `@supabase/supabase-js`).

## Out of scope

- Offset/time rules — core.
- UI states beyond the *unavailable* signal — shell.

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
