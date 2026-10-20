# VS Code shell — spec

- **Status:** active
- **Context:** presentation (shell)
- **Code:** `apps/vscode`
- **Depends on:** Prayer Times (core), Data (port)

## Purpose

A VS Code extension shell over core: the day's prayer times in the editor
status bar, plus a sidebar view with all eight entries and the same district,
language and clock choices as the other shells. Rendering and platform glue
only; no domain rules.

## Behavior

### Status bar

- A right-aligned status bar item shows the current entry's translated label and
  its formatted time, for the selected district. Before the day's first entry
  there is no current entry, so it shows the next one instead.
- Its tooltip carries the Masihi and Hijri dates, the duration to the next
  entry, the district and the data-source credit. The next entry lives only in
  the tooltip so the bar stays quiet.
- The item updates while the editor is open, without a reload.
- Clicking the item reveals the times view in the activity bar.
- The item can be hidden with the `wsb.statusBar` setting; the choice persists
  in the editor configuration.

### Notifications

- Notifications are opt-in (`wsb.notifications`, off by default); the choice
  persists in the editor configuration.
- On first install the extension asks once whether to enable notifications; the
  answer sets `wsb.notifications` and is never asked again.
- When enabled, the extension raises one notification 15 minutes before each
  prayer and one at the prayer's time. `imsak`, `syuruk` and `doha` are time
  boundaries and never notify.
- Delivery uses a timer in the extension host against core's reminder schedule,
  so it only fires while the editor is running; a missed reminder is caught up
  to two minutes late.
- Reminder text is localized and uses the chosen time format.

### Times view

- The times view is a webview in its own activity-bar container, not an editor
  tab, so it stays out of the main editor area.
- It shows the same eight entries, dates, current highlight and duration to the
  next as the web shell, for the selected district.
- A district selector, language selector (default Malay; Malay, Jawi Malay,
  Arabic, English) and 12/24-hour choice live in the panel; each choice is
  stored in the editor configuration and re-rendered immediately.
- Arabic-script locales (`ms-Arab`, `ar`) render right-to-left and use the
  bundled Noto Naskh Arabic webfont (SIL OFL), reusing the extension's copy.
- Dates and the Hijri date render in the active locale's script; Arabic-script
  locales use Arabic-Indic digits (٠١٢…) for times and dates.
- "Reload data" refetches the current day.
- The view links to the web app and credits the MORA/KHEU source; both open in
  the browser through the extension host.
- The extension icon matches the browser extension's.

### Data

- Times come from Supabase through the Data port. The device cache is the
  editor's `globalState`; it is served first and a failed refresh falls back to
  the last known day.
- MORA is never contacted at runtime.
- With no Supabase configuration the panel shows the unavailable state; there
  is no fake fallback.

### Settings

- Settings: status bar on/off, notifications on/off, language, time format,
  district.
- Defaults: status bar on, notifications off, language `ms`, time format `24h`,
  district Brunei & Muara.
- Settings are contributed under the `wsb.*` namespace and survive restarts.

### Packaging

- The extension is buildable as an unpacked directory and as a `.vsix` artifact
  (`pnpm --filter wsb-vscode package`).
- The `.vsix` is attached to the same GitHub release as the browser extension.
- The same `.vsix` is published to the VS Code Marketplace and Open VSX on a
  tag push when `VSCE_PAT` / `OVSX_PAT` are configured; each is skipped when its
  token is absent, and a duplicate version is not an error.

## Invariants

- No domain rule in the shell; core owns offsets, progress, formatting and the
  reminder schedule.
- Every runtime user-facing string is a translation key from the same
  catalogues as the web shell. Command titles and setting descriptions are VS
  Code manifest metadata, not runtime UI.
- The shell ships only the public Supabase URL + anon key (read-only RLS); no
  service-role key. It never contacts MORA at runtime.
- The bundle contains no remote code and no analytics.

## Acceptance criteria

- [ ] The status bar shows the current entry and time for the selected district;
      before the first entry it shows the next one.
- [ ] The status bar tooltip carries the next entry and the duration to it.
- [ ] The times view renders the eight entries in order in the sidebar.
- [ ] Selecting Tutong/Belait shifts the entries by +1/+3 minutes.
- [ ] The current entry is highlighted and the duration to next is shown.
- [ ] District, language and time format survive a restart.
- [ ] Choosing Arabic or Jawi flips the panel right-to-left and uses the
      Arabic-script font.
- [ ] Hiding the status bar removes it immediately and persists.
- [ ] Enabling notifications persists the choice and schedules reminders.
- [ ] The first install asks once whether to enable notifications.
- [ ] Imsak, Syuruk and Dhuha never notify; the five prayers do.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] The view links to the web app and the source, opening each in the browser.
- [ ] The build produces a `.vsix` artifact.

## Out of scope

- Business logic — core.
- Backend/network adapters — Data.
- OS-level delivery while the editor is closed — the timer only runs with the
  extension host.

## Changelog

- 2026-10-20 — initial: status bar, times panel, settings, vsix packaging.
- 2026-10-20 — the status bar shows the current entry; the next entry moves to
  the tooltip. Add opt-in in-editor prayer notifications.
- 2026-10-21 — ask once after install before enabling notifications; move the
  times panel into a sidebar activity-bar view; link to the web app; use the
  browser extension's icon.
- 2026-10-21 — publish the `.vsix` to the VS Code Marketplace and Open VSX from
  the release workflow when tokens are present (was out of scope).
