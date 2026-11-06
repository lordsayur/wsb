# Notifications — spec

- **Status:** active
- **Context:** supporting domain
- **Code:** `packages/data/src/notifications.ts`, `apps/web/app/pages/notifications.vue`, `apps/web/app/pages/admin/notifications.vue`
- **Depends on:** Data, Release, Web

## Purpose

Tell a reader what changed: a new app version since they last looked, and any
message an admin chooses to publish. Notifications are read in the app; there
is no push channel and no email.

## Ubiquitous language

- **Announcement** — a message an admin publishes at runtime: a title and body
  per locale, an optional internal or `https` link, and an optional expiry.
- **Version notice** — a notification derived from the bundled changelog for
  every app version newer than the one this device last acknowledged.
- **Seen mark** — the device's record of when it last opened the notifications
  page and which app version was running then.

## Behavior

### Reading

- `/notifications` shows, newest first: the version notices and the active
  announcements, each with its title, body, date and link when it has one.
- A version notice links to `/changelog`; the newest one also carries the
  running version.
- An announcement renders in the reader's locale; when that locale has no text
  it falls back to Malay, then to the first locale that has text.
- Opening the page records a seen mark; the page is then read.
- With nothing to show, the page shows an empty state ("You are up to date"),
  never an error.
- An announcement whose `expires_at` has passed is never shown, and is never
  counted as unread.
- A failed announcement read shows the version notices only; it never blocks
  the page.

### Unread

- The footer menu's **Notifications** entry carries a dot while something is
  unread.
- Unread means: an active announcement newer than the seen mark, or an app
  version newer than the acknowledged one.
- A device with no seen mark counts the running version as one unread version
  notice, not its whole history, and treats every active announcement as
  unread.

### Publishing (admin)

- `/admin/notifications` is behind the same sign-in and allowlist gate as the
  other admin pages, and is listed in the admin menu.
- An allowlisted admin composes an announcement in Malay — a title and body,
  an optional link and an optional expiry. The stored message map can hold other
  locales, and the reader falls back to Malay; the compose form writes Malay
  only for now.
- The same page lists announcements newest first with their date and whether
  they are active, and can delete one.
- Announcements are written only through the `admin` Edge Function; the table
  is read-only to everyone else.
- A blank Malay title or body, an over-long field, or a link that is neither an
  internal path nor `https` is rejected without writing.

## Invariants

- The browser never decides who may publish; the database and the Edge
  Function do.
- Notification text is content, not UI chrome: it is authored, so it is stored
  per locale rather than read from the translation catalogues.
- A version notice is never invented; it comes from the bundled changelog.

## Acceptance criteria

- [ ] `/notifications` lists an active announcement and a newer version notice,
      newest first.
- [ ] An expired announcement is not shown and does not count as unread.
- [ ] With no seen mark, only the running version is reported as a new version.
- [ ] A device with a seen mark newer than every announcement and running the
      newest version shows no unread dot.
- [ ] An announcement with only Malay text renders that text in every locale.
- [ ] `/admin/notifications` rejects a blank Malay title without writing.
- [ ] A link that is not an internal path or `https` is rejected without
      writing.
- [ ] Deleting an announcement removes it from `/notifications`.

## Interfaces

- `Announcement`, `AnnouncementMessages`, `AnnouncementInput`.
- `validateAnnouncement(input): Validation<AnnouncementInput>`.
- `announcementText(announcement, locale)`.
- `activeAnnouncements(list, now)`, `sortAnnouncements(list)`.
- `versionNotices(entries, running, acknowledged)`.
- `unreadCount(input): number`.

## Out of scope

- Push, email and SMS delivery.
- Per-account read state; the seen mark is per device.
- Rich text or images in announcements.

## Changelog

- 2026-11-04 — initial draft: in-app version notices and admin-authored
  announcements.
