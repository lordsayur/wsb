# Changelog

Every version the web app ships, newest first. `pnpm version:bump` writes a new
entry; the app renders this list at `/changelog`.

## 4.0.0-beta.13 — 2026-11-10

- Show seconds in the countdown for the last 15 minutes, tick the passed-entry note in seconds and phrase it as "<duration> passed" in every shell.

## 4.0.0-beta.12 — 2026-11-08

- Fix the Raycast extension review findings: the day keeps its own date when served stale, a partial day is never cached, the list updates its markers while open and reloads at Brunei midnight, the reload reports failures, the header shows the countdown, and the shell is US English only with no custom translation layer.

## 4.0.0-beta.11 — 2026-11-07

- Fix the Netlify 500: build on Node 22 and never create the Supabase client while server-rendering, since its realtime layer needs a native WebSocket.

## 4.0.0-beta.10 — 2026-11-07

- Hide the summary slide's deck chrome: the card carries the basmalah at its own top and the data-source note is gone.

## 4.0.0-beta.9 — 2026-11-07

- Fit the tasbih page on one screen: the device takes the leftover height and the controls never scroll out of view.

## 4.0.0-beta.8 — 2026-11-07

- Give every page outside the home deck one header: a flat nav with a menu (settings, home and every destination) plus the basmalah, with hand-mode control over which side the menu takes.

## 4.0.0-beta.7 — 2026-11-07

- Fix the footer menu items (Prayer times, reload, settings) doing nothing: v-on object keys must match the emitted camelCase event names, and a test now enforces it.

## 4.0.0-beta.6 — 2026-11-07

- Rename the Quran verse page to "Quran verse challenge" and move its route to /quran-verse-challenge, keeping /ayat as a redirect.

## 4.0.0-beta.5 — 2026-11-04

- Replace the Markdown feedback body with one plain-text field per section and
  a per-kind hint, so the sender never writes Markdown.

## 4.0.0-beta.4 — 2026-11-04

- Seed the feedback body with a per-kind Markdown template and a hint, keep
  typed text when the kind changes, and reject a template that was never
  filled.

## 4.0.0-beta.3 — 2026-11-04

- Let feedback carry up to three screenshots: scaled in the browser, stored
  in the public `feedback` bucket, and embedded in the filed issue.

## 4.0.0-beta.2 — 2026-11-04

- Add `/feedback`: the form files a GitHub issue from the server, so sending
  feedback needs no GitHub account; linked from the footer menu and `/about`.

## 4.0.0-beta.1 — 2026-11-04

- Add `/about`, which shows the running version, the beta marker and the data
  source.
- Add `/changelog`, rendering this file newest first.
- Add `/notifications` for version notices and admin-authored announcements,
  with an unread dot in the footer menu.
- Add `/admin/notifications` to publish and delete announcements.
- Add the version and changelog bump script and its CI check.
