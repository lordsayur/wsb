# Browser extension — spec

- **Status:** active
- **Context:** presentation (shell)
- **Code:** `apps/extension`
- **Depends on:** Prayer Times (core), Data (port)

## Purpose

A Manifest V3 browser-extension shell over core: prayer times in the toolbar
popup, device notifications, and a small on-page header. Rendering and platform
glue only; no domain rules.

## Behavior

### Popup

- The toolbar popup shows the same six entries, day, dates, current highlight
  and duration to the next as the web shell, for the selected district.
- A district selector, language selector (default Malay; Malay, Jawi Malay,
  Arabic, English) and 12/24-hour choice live in the popup; each choice is
  stored with `chrome.storage.local` and restored on the next open.
- Arabic-script locales (`ms-Arab`, `ar`) render right-to-left and use the
  bundled Noto Naskh Arabic webfont (SIL OFL), in the popup and on-page header.
- Dates and the Hijri date render in the active locale's script; Arabic-script
  locales use Arabic-Indic digits (٠١٢…) for times and dates.
- Times come from Supabase through the Data port. The device cache in
  `chrome.storage.local` is served first; a failed refresh falls back to the
  last known day. MORA is never contacted at runtime.
- "Reload data" refetches the current day.
- The popup credits the MORA/KHEU source.

### Notifications

- Notifications are opt-in: the browser grants the `notifications` permission
  at install, and the toggle is the runtime opt-in. The choice persists.
- When enabled, the extension raises one notification 15 minutes before each
  prayer and one at the prayer's time. `syuruk` never notifies.
- Delivery uses a background service worker with `chrome.alarms`, so it fires
  while the browser is running even when the popup is closed.
- Reminder text is localized and uses the chosen time format and district.

### On-page header

- A compact fixed header bar is injected at the top of every page by default.
  It sits in the page flow via a spacer, so it never covers existing content
  (it is not a floating overlay).
- The header shows all six entries with their times, highlighting the current
  entry, plus the next entry and the duration until it.
- When the viewport is too narrow for all entries, the header falls back to the
  next entry and duration only, prefixed with a "Next" caption. The caption is
  hidden whenever the full entry list is visible so it is not read as a label
  for the first entry.
- The header can be disabled from the popup; the choice persists and applies to
  open pages immediately.
- The header is isolated in a shadow root so page styles cannot break it and it
  cannot break the page.
- The header has a close button that disables it; it never blocks page input
  (pointer events stay on the header itself).

### Update awareness

- Because the extension is installed unpacked and unlisted, Chrome never checks
  for updates. The worker instead compares the installed `manifest.version`
  with the latest GitHub release tag.
- The check runs on install/startup and every 6 hours; it never throws and
  keeps the last known result when GitHub is unreachable.
- When the release is newer, the toolbar action shows a `↑` badge and the popup
  shows a localized "version available" prompt linking to the release page.
- Installing the update is still manual: download the zip, load unpacked.

### Settings

- Settings: notifications on/off, on-page header on/off, language, time format,
  district.
- Defaults: notifications off, header on, language `ms`, time format `24h`,
  district Brunei & Muara.

### Packaging

- The extension is buildable as an unpacked directory and as a zip artifact.
- The zip is attached to a GitHub release so users can download and install it
  from the release page.

## Invariants

- No domain rule in the shell; core owns offsets, progress, formatting and the
  reminder schedule.
- Every user-facing string is a translation key (same catalogues as the web
  shell).
- The extension ships only the public Supabase URL + anon key (read-only RLS);
  no service-role key. It never contacts MORA at runtime.
- The extension bundle contains no remote code and no analytics.

## Acceptance criteria

- [ ] The popup renders the six entries in order for the selected district.
- [ ] Selecting Tutong/Belait shifts the entries by +1/+3 minutes.
- [ ] The current entry is highlighted and the duration to next is shown.
- [ ] The district, language and time format survive reopening the popup.
- [ ] Choosing Arabic or Jawi flips the popup and header right-to-left and uses
      the Arabic-script font.
- [ ] Enabling notifications persists the choice and schedules reminders.
- [ ] Notifications fire 15 minutes before and at each prayer; syuruk never
      notifies.
- [ ] The on-page header shows all entries with times and is enabled by
      default, falling back to the next entry on narrow viewports.
- [ ] Disabling the header removes it from already-open pages.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] The build produces an installable unpacked extension and a zip artifact.
- [ ] A newer GitHub release shows an update badge and popup link.

## Out of scope

- Business logic — core.
- Backend/network adapters — Data.
- Firefox/Safari packaging — Chromium MV3 first.

## Changelog

- 2026-10-18 — initial: popup, notifications, on-page header, release zip.
- 2026-10-18 — offline first; Supabase is the only runtime source (MORA import
  is manual and monthly).
- 2026-10-19 — on-page header is a fixed in-flow bar showing all entries; update
  awareness via the latest GitHub release; repository is public.
- 2026-10-19 — add Arabic (`ar`) and Jawi Malay (`ms-Arab`) locales with the
  Arabic-script font and right-to-left layout.
- 2026-10-19 — hide the header's "Next" caption when all entries are shown;
  keep it in the narrow fallback.
