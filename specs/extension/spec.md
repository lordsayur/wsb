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
- A district selector, language selector (default Malay) and 12/24-hour choice
  live in the popup; each choice is stored with `chrome.storage.local` and
  restored on the next open.
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

- A small, unobtrusive header is injected into every page by default, showing
  the next entry and the duration until it.
- The header can be disabled from the popup; the choice persists and applies to
  open pages immediately.
- The header is isolated in a shadow root so page styles cannot break it and it
  cannot break the page.
- The header has a close button that disables it; it never blocks page input
  (pointer events stay on the header itself).

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
- [ ] Enabling notifications persists the choice and schedules reminders.
- [ ] Notifications fire 15 minutes before and at each prayer; syuruk never
      notifies.
- [ ] The on-page header shows the next entry and is enabled by default.
- [ ] Disabling the header removes it from already-open pages.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] The build produces an installable unpacked extension and a zip artifact.

## Out of scope

- Business logic — core.
- Backend/network adapters — Data.
- Firefox/Safari packaging — Chromium MV3 first.

## Changelog

- 2026-10-18 — initial: popup, notifications, on-page header, release zip.
- 2026-10-18 — offline first; Supabase is the only runtime source (MORA import
  is manual and monthly).
