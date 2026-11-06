# Changelog

Every version the web app ships, newest first. `pnpm version:bump` writes a new
entry; the app renders this list at `/changelog`.

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
