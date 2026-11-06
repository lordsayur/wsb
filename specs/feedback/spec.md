# Feedback — spec

- **Status:** active
- **Context:** supporting domain
- **Code:** `packages/data/src/feedback.ts`, `apps/web/server/api/feedback.post.ts`, `apps/web/app/pages/feedback.vue`, `apps/web/app/components/organisms/FeedbackForm.vue`
- **Depends on:** Release, Web

## Purpose

Let a reader tell the maintainers something — a bug, an idea, anything — without
leaving the app and without needing a third-party account. The message becomes a
GitHub issue so it is tracked where the work happens.

## Ubiquitous language

- **Feedback** — one submitted message: a kind, a title, a body, an optional
  contact, and the context it was written in.
- **Kind** — `bug`, `idea` or `other`. A bug is filed with the `bug` label; the
  others are unlabelled.
- **Issue** — the GitHub issue a feedback message becomes. Filing happens
  server-side with a maintainer's token.
- **Attachment** — one screenshot the sender attaches, at most three per
  message. It lives in the public `feedback` storage bucket and is embedded in
  the issue.
- **Section** — one labelled part of a message (what happened, expected, steps,
  …). The sender writes plain text in one field per section and never writes
  Markdown; the issue body is composed from the filled sections.

## Behavior

### Who needs what

- Sending feedback needs **no GitHub account and no sign-in**. The reader fills
  the form and the app's own server files the issue with a maintainer token.
- A reader who does have GitHub is also offered a prefilled **new issue** link
  when the form already has a title and a body. The link is a convenience, never
  the only path.
- With no token configured the server still accepts the message and logs it, so
  a misconfigured deployment loses nothing and never blocks the sender.

### The form

- `/feedback` offers the three kinds, a required title (120 characters), a
  required body (at least 10 real characters, at most 4000), and an optional
  contact field (200).
- Choosing a kind shows that kind's hint and one plain-text field per section:
  - **Bug** — what happened, what you expected, steps to reproduce, device and
    version.
  - **Suggestion** — the problem, the proposal, alternatives.
  - **Other** — a single message section.
- The sender never types Markdown and never sees a heading syntax. Each filled
  field becomes a `###` section in the issue; empty fields are omitted.
- Changing kind rebuilds the fields. Text is kept for a heading both kinds
  share, and otherwise by position, so switching never silently discards what
  was written.
- Sections alone do not count toward the minimum: with every field empty, the
  body is empty and the message is rejected, so every submission carries real
  content.
- The page states plainly that no GitHub account is needed.
- Submitting validates locally first, then posts to the app's own route. The
  browser never calls the GitHub API and never sees the token.
- On success the form clears and a thank-you message is shown in the reader's
  locale.
- On failure the message stays in the form and a localized error is shown.
- The form carries the page the reader came from, the running version and the
  locale onto the issue, so a maintainer has context without asking.
- The form accepts up to three screenshots (PNG, JPEG or WebP). Each is scaled
  so its longest edge is at most 1600px and re-encoded when it is still over
  700 KB, before it leaves the device.
- A picked image uploads immediately and appears as a thumbnail the sender can
  remove; the message is not sent until **Submit**. An image that fails to
  upload shows a localized error and never blocks the message.
- A hidden field acts as a honeypot: a human never fills it, and a submission
  that does is answered with success but writes nothing.

### Filing

- The server refuses a payload with an unknown kind, a blank title, or a body
  shorter than 10 characters.
- At most five messages per caller per ten minutes; beyond that the route
  answers `429` with a localized "too many messages".
- The issue body carries the message, the attachments as Markdown images, then
  a rule, then the context lines: kind, version, locale, page, contact.
- An attachment URL must point at this project's own public `feedback` bucket;
  any other URL is dropped, so a message can never hotlink an arbitrary image
  into an issue.
- A GitHub rejection is reported as a failure to the sender (`502`) and logged
  server-side; it is never silently swallowed.

### Storage

- The `feedback` bucket is public for reads (an issue must render the image)
  and writable only by the service role. It accepts PNG, JPEG and WebP up to
  2 MB, and the route sniffs the real type from the file's first bytes so a
  declared `Content-Type` is never trusted.
- `POST /api/feedback/upload` stores one image and returns its public URL; it is
  rate limited separately from message submission.
- The service role key is server runtime config only; the browser never holds
  write credentials.

### Reaching it

- The footer menu has a **Feedback** entry, and it carries the page the reader
  came from as `?from=`; that path is stamped onto the issue as `Page`.
- `/about` links to `/feedback` and `/privacy`.

## Invariants

- The GitHub token and the service role key live only in server runtime config.
  Neither is in a public runtime config value, a client bundle or a cookie.
- The form does not require, collect or transmit an identity.
- The same validation runs in the browser and on the server; the server is the
  authority.
- A bot submission is never filed.

## Acceptance criteria

- [ ] A complete message posts to `/api/feedback` and the route files one issue
      whose body contains the message and the context lines.
- [ ] With no token the route accepts the message, writes nothing to GitHub and
      logs it.
- [ ] A blank title, a short body or an unknown kind is rejected with `400` and
      files nothing.
- [ ] A filled honeypot is answered with success and files nothing.
- [ ] The sixth message in ten minutes is rejected with `429`.
- [ ] A GitHub error is reported as `502` and logged.
- [ ] `/feedback` states that no GitHub account is needed.
- [ ] The form's GitHub link encodes the same title and body as the issue.
- [ ] `/feedback` is reachable from the footer menu and from `/about`.
- [ ] A picked screenshot uploads and appears as a removable thumbnail before
      the message is submitted.
- [ ] The filed issue embeds each attachment as a Markdown image, in pick order,
      and the image URL resolves publicly.
- [ ] An attachment URL outside this project's bucket is dropped before filing.
- [ ] An upload of a text file declared as `image/png` is rejected with `415`.
- [ ] An upload over 2 MB is rejected with `413`.
- [ ] A message with every section empty is rejected as too short.
- [ ] Switching kind rebuilds the fields and preserves text.
- [ ] Each kind shows its own hint and one field per section.
- [ ] The issue body has one `###` heading per filled section and none for an
      empty one.

## Interfaces

- `validateFeedback(value, honeypot): Validation<FeedbackInput>`.
- `normalizeAttachments(value): string[]`, `isAttachmentUrl(value)`.
- `fitWithin(width, height, maxEdge)`, `shrinkImage(file)`.
- `TEMPLATE_SECTIONS`, `composeBody(sections)`, `meaningfulLength(body)`.
- `issueContent(feedback, { repo }): { title, body, labels }`.
- `issueLink(feedback, { repo }): string`.
- `POST /api/feedback` → `{ ok, filed?, url?, error? }`.
- `POST /api/feedback/upload` → `{ ok, url?, error? }`.

## Out of scope

- Two-way conversation with the sender; replies happen on the issue.
- Video, PDFs and other non-image attachments.
- Sweeping attachments from messages that were never submitted.
- Any GitHub account, OAuth scope or sign-in for readers.

## Changelog

- 2026-11-04 — initial draft: in-app form, server-filed GitHub issue, no account
  needed.
- 2026-11-04 — add up to three screenshots per message: scaled in the browser,
  stored in the public `feedback` bucket, embedded in the issue.
- 2026-11-04 — replace the Markdown body with one plain-text field per section
  and a per-kind hint; the issue body is composed from the filled fields, so the
  sender never writes Markdown.
