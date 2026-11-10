# Raycast shell — spec

- **Status:** active
- **Context:** presentation (shell)
- **Code:** `apps/raycast`
- **Depends on:** Prayer Times (core), Data (port)

## Purpose

A Raycast extension shell over core: the day's prayer times in a searchable list
opened from the launcher. Rendering and platform glue only; no domain rules.

## Behavior

### Prayer times command

- The command shows the same eight entries, day and dates as the web shell, for
  the selected district: Imsak, Subuh, Syuruk, Dhuha, Zuhur, Asar, Maghrib,
  Isyak, in order.
- A section header carries the weekday, the Masihi date, the Hijri date and the
  duration until the next entry.
- The current entry is marked; the list focuses it when the command opens. The
  markers follow a one-second clock, so "Now"/"Next" move while the list stays
  open; when the Brunei date changes the day is reloaded rather than keeping
  yesterday's schedule.
- Each row shows the prayer label and its formatted time; the next entry is
  tagged "Next".
- A district dropdown sits in the search bar; choosing a district re-renders
  immediately and the choice persists across launches.
- When the day came from the cache because the source was unreachable, the
  section subtitle says the app is offline; the list still renders. A stale day
  is labelled with the date it was fetched for, never with today's date.
- The interface is US English only, with no language preference: Raycast
  supports US English alone and its guidelines forbid custom localization.
  Labels are literal strings in `src/shared/strings.ts`; domain values
  (`PrayerName`, `District`) stay identifiers and are mapped to labels there.
- The 12/24-hour choice is an extension preference; changes apply on the next
  command launch. Dates and times are formatted with the core helpers at
  locale `en`, so the shell keeps one date format everywhere.
- "Reload data" refetches the current day and reports the outcome: success only
  when fresh data arrived, a failure toast when the source could not be reached.
- Actions link to the web app and credit the MORA/KHEU source; both open in the
  default browser.

### Data

- Times come from Supabase through the Data port. The device cache is
  Raycast's `LocalStorage`; it is served first and a failed refresh falls back
  to the last known day.
- MORA is never contacted at runtime.
- With no Supabase configuration the command shows the unavailable state; there
  is no fake fallback.

### Settings

- Preferences: time format (default `24h`) and district (default Brunei &
  Muara). There is no language preference.
- The district dropdown's persisted choice wins over the district preference on
  the next launch.

### Packaging

- The extension is buildable as a Raycast extension directory
  (`pnpm --filter wsb-raycast build`) with `@raycast/api` left external.
- `pnpm raycast:store` exports a self-contained Store submission to
  `apps/raycast/store/brunei-prayer-times`: core and data are vendored as
  generated files (no `workspace:` deps, no monorepo imports), the public
  Supabase URL + anon key are committed, and the manifest metadata and defaults
  are English (the Store is US-English only).
- The export refuses to run if the anon key slot ever holds a service-role key.
- The manifest declares `"platforms": ["macOS"]`: the screenshots and manual
  testing are macOS-only, and the Store requires the field. Widen it only after
  the command is verified on Windows.
- Distribution is the Raycast Store (a PR against `raycast/extensions`), which
  builds each extension with npm and needs a `package-lock.json`; there is no
  downloaded artifact. Screenshots (2000×1250) are captured manually on macOS.

## Invariants

- No domain rule in the shell; core owns offsets, progress, formatting and the
  reminder schedule.
- User-facing text is literal US English in `src/shared/strings.ts`; the shell
  does not reuse the web catalogues and ships no localization layer. Manifest
  text (command title, preference labels) is Raycast metadata, not runtime UI.
- The shell ships only the public Supabase URL + anon key (read-only RLS); no
  service-role key. It never contacts MORA at runtime.
- The bundle contains no remote code and no analytics.

## Acceptance criteria

- [ ] The command renders the eight entries in order for the selected district.
- [ ] Selecting Tutong/Belait shifts the entries by +1/+3 minutes.
- [ ] The current entry is marked and the duration to next is shown.
- [ ] The district choice survives relaunching the command.
- [ ] The time format preference changes the clock format.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] The command copies/links the web app and the source, opening each in the
      browser.
- [ ] The build produces a Raycast extension directory.
- [ ] The Store export contains no `@wsb/*` or `workspace:` imports and builds
      and lints with npm alone.

## Out of scope

- Business logic — core.
- Backend/network adapters — Data.
- Notifications, menu-bar extra and background scheduling — Raycast extensions
  run only while a command is open.
- Capturing Store screenshots — manual, on macOS with Raycast's Window Capture.
- Opening the Store PR — manual, via `npm run publish` in the exported folder.

## Changelog

- 2026-10-21 — initial: prayer times command, district dropdown, preferences,
  Supabase through the Data port.
- 2026-10-21 — add a self-contained Store export (vendored core/data, committed
  public config, English metadata) with the `pnpm raycast:store` script.
- 2026-10-21 — drop the macOS-only platform restriction; the whole spec applies.
- 2026-11-10 — show seconds in the duration for the last 15 minutes.
