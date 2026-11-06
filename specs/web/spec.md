# Web shell — spec

- **Status:** draft
- **Context:** presentation
- **Code:** `apps/web`
- **Depends on:** Prayer Times (core), Data (port)

## Purpose

The PWA rendering surface. A thin shell over core: it reads state and draws it.
Owns no business logic, no offsets, no time math.

## Ubiquitous language

Uses core terms from [`../glossary.md`](../glossary.md). Owns none.

## Behavior

### Internationalization

- All user-facing text goes through `@nuxtjs/i18n` (Nuxt I18n, powered by Vue
  I18n). No literal UI strings in templates or components.
- Supported locales: Malay (`ms`, default, Latin script), Jawi Malay
  (`ms-Arab`), Arabic (`ar`), and English (`en`, fallback).
- Message catalogues live in `apps/web/i18n/locales/<locale>.json`; every
  catalogue carries the same keys.
- Locale is switchable from the footer menu at runtime; the choice is stored in
  a cookie (`wsb.locale`) and restored on the next visit, including SSR.
- Arabic-script locales (`ms-Arab`, `ar`) render right-to-left (`dir="rtl"`)
  and use the self-hosted Noto Naskh Arabic webfont; Latin locales stay
  left-to-right. The font is served from `/fonts` under the SIL OFL.
- Dates and the Hijri date follow the active locale's script: Arabic-script
  locales show Arabic-script month, weekday and Hijri names even though the
  source's Hijri value is Malay in Latin script.
- Arabic-script locales render numbers, dates and times with Arabic-Indic
  digits (٠١٢٣٤٥٦٧٨٩), not Latin digits.
- Prayer names are translated labels, not domain data: core provides
  `PrayerName`; the shell maps it to a message key.
- Dates/times are formatted by core for the active locale; the shell renders
  the display-ready values.

### Display

- The main section is centered horizontally and vertically.
- The main section shows, in order: the day name, the Masihi and Hijri dates
  side by side, then the prayer times.
- There is no title or tagline in the UI.
- From Subuh until the end of Zuhur show all eight entries in order, labelled
  (Imsak, Subuh, Syuruk, Dhuha, Zuhur, Asar, Maghrib, Isyak). From midnight
  until Subuh show the six later entries in order and put today's Imsak and
  Subuh at the bottom under the dashed divider. From Asar show Zuhur,
  Asar, Maghrib and Isyak, then the next day's Imsak and Subuh at the bottom,
  labelled with their normal names. The rows are always on screen:
  while loading or unavailable their times render as a muted placeholder, so
  opening the app never shows a blank sheet.
- From Maghrib until midnight the Hijri date shown is the next day's; the
  Masihi date is unchanged.
- Highlight the current entry (from core's current/next progress) with a visible
  style and an accessible current marker.
- The countdown to the next entry ("<duration> left" from the localized
  `next.countdown` phrase) sits inline in that entry's own row, immediately
  before its time. No prayer name or time is ever repeated, and there is no
  separate card or progress bar. Only that note turns primary with 15 minutes or
  less left.
- For the first 20 minutes after an entry (Imsak excepted) that entry's row
  reports how long ago it passed ("<minutes> after", or "just started" in its
  first minute) inline beside its time; while it shows, the countdown is hidden,
  so only one note is ever visible. The yellow near-time styling applies only to
  a real countdown.
- Every entry renders at the same type size; only the countdown line is
  secondary in weight and tone.
- Entries moved to the bottom — the next day's Imsak and Subuh after Asar, or
  today's own before Subuh — follow the rest of the list without a divider.
- The day's data state is one status line directly under the dates, with a
  spinner while loading or revalidating.
- Durations under one minute render in seconds; otherwise in whole minutes (and
  hours when non-zero).
- The highlight and duration update while the app is open, without a reload.
- The whole day page fits the viewport without scrolling, at any screen size.
  The prayer-times table scrolls inside its own area, never the page.
- On non-mobile screens (768px and wider) the prayer-times table and the graph
  use the full width of the screen; the daily view keeps its compact centred
  column.
- The daily view maximises the prayer text: the eight entries share the space
  left between the header and the controls, with their labels and times scaled
  to the available height.
- Browser zoom is disabled: the viewport forbids user scaling and touch
  gestures do not pinch-zoom the page.
- When data is unavailable, show an empty/offline state; never a blank crash.

### Pages

- The home is a deck of three slides the reader swipes between: **Summary**,
  **Today** and **Weekly**, in that order, wrapping at both ends. Each slide is
  its own route, so analytics counts it as its own page:
  - `/summary` — the dashboard slide;
  - `/today` — the daily page (the app's original home);
  - `/week` — the weekly table.
- All three slides share one layout (`layouts/home.vue`): the data source note,
  the page indicator, the slide area, the footer and the update prompt. The
  layout owns the day's data and the swipe; the slide pages only render it.
- `/` redirects to the slide the reader last viewed, remembered in a
  `wsb.homeSlide` cookie; with no cookie it opens `/summary`. Older addresses
  keep working: `/?view=month` and a bare `/?month=YYYY-MM` open
  `/prayer-times`, `/?view=day` opens `/today`, and `district` carries over.
- The page indicator sits above the slide area: one dot per slide, the current
  one marked and named for assistive tech. Tapping a dot opens that slide.
- A horizontal swipe moves one slide left or right and wraps at the ends.
  Swipes that start on a control or a selectable table area do not navigate.
- Every slide keeps the district in the address (`district=<district>`, only
  when it is not the default), so the footer, the share button and the weekly
  table always agree.
- **Prayer times** is a page with a header nav: **Table** and **Graph**. They
  are two separate routes so analytics counts them apart:
  - `/prayer-times` — the monthly table;
  - `/prayer-times/graph` — the prayer-times graph.
- Both prayer-times routes load on first visit as their own route bundles; the
  home slides do not ship the table or the chart code.
- The menu has a **Prayer times** entry that opens `/prayer-times`; the weekly
  slide also links straight to it ("all prayer times"). Both pages link back
  to the home and to each other through the header nav.
- `/about`, `/changelog`, `/notifications` and `/feedback` are plain pages
  reached from the footer menu, each linking back to the app.
- Every route path is English. Locale only changes labels, never the address.
- The address carries each page's selection, and is updated in place
  (`replace`, no history entry) as it changes. Defaults stay out of the
  address, so the pages stay clean and shareable:
  - `district=<district>` when it is not the default Brunei & Muara;
  - `month=YYYY-MM` on `/prayer-times` while it shows another Brunei month;
  - `range=month` on `/prayer-times/graph` when the graph is not annual, and
    `date=YYYY-MM-DD` when its period is not the current one.
- Opening a link restores the selection it names; unknown or malformed values
  fall back to the defaults instead of erroring.
- The old `/trend` address redirects to `/prayer-times/graph`, and an old
  `/?view=month&month=…` address redirects to `/prayer-times`, keeping the
  query, so existing links keep working.

### Home slides

- **Summary (`/summary`)** is the dashboard, a calm, centred view: the weekday
  and both dates at the top; the running entry as the hero (its name large, its
  time under it); and below it, in a smaller line, the next entry with its time
  and the countdown (or the passed-entry note). The hero turns primary when the
  next entry is 15 minutes or less away. Before the day's first entry there is
  no hero, only the next entry. The slide is a surface for future additions
  (for example the nearest mosque); the simplified view leaves that room
  without adding them yet. A decorative background (soft colour orbs and a
  faint lattice) sits behind the text, respects `prefers-reduced-motion`, and
  carries no information.
- **Summary menu.** The dashboard never shows the deck footer. Instead a
  floating menu button sits bottom-right and opens a dock over the card holding
  the same footer the other slides use (district selector, share, settings)
  plus a **fullscreen** action; the deck's chrome (source note, page dots)
  stays. Choosing fullscreen makes the card fill the screen and the chrome
  step aside; the same dock then offers **exit fullscreen**. Escape closes the
  dock first, then leaves fullscreen; leaving the summary slide (swipe or dot)
  closes the dock and leaves fullscreen. The button is absent on the other
  slides, which keep their inline footer.
- **Keep screen on.** The dock's action row pairs the fullscreen step with a
  **keep screen on** toggle, offered only where the Screen Wake Lock API
  exists. Turning it on requests a screen wake lock so the phone does not
  sleep while the dashboard is on show; turning it off releases the lock. The
  choice is remembered across visits; the browser may drop the lock (for
  example when the tab is hidden), so it is re-requested when the page becomes
  visible again. A refused request leaves the preference stored and the UI
  quiet. The toggle carries `aria-pressed` and a single label; while on it is
  marked primary.
- **Today (`/today`)** is the daily page exactly as it was: the phase-aware
  list, the current-entry highlight, the countdown, the passed-entry note and
  the loading/offline status.
- **Weekly (`/week`)** is a table of one Monday-first week, transposed: prayer
  entries down the y axis and the week's days across the x axis, so a whole
  week reads without scrolling sideways. Today's column is highlighted and the
  current entry is marked in it.
- The weekly table steps one week at a time in the slide's footer and returns
  to this week; a step never leaves the slide.
- The slide header names the week it shows (for example `2 Nov – 8 Nov`).
  Weeks read through the Data port (`readMonth`), so a week spanning two
  months reads both; cached days paint first and missing ones leave `—`.
- Week highlighting follows the deck's clock: at Brunei midnight the open slide
  moves to the new week instead of highlighting yesterday, and the current
  entry is resolved by core so the weekly and daily slides always agree.
- A slow earlier week read never replaces a newer one; the slide keeps the
  latest request's data.

### Monthly table (`/prayer-times`)

- The page header shows the back link, the title and a **Table / Graph** nav;
  the current page is marked as current.
- The table shows one row per day of the selected Brunei month with the eight
  entry columns, so the whole month is visible at a glance.
- The month selector lives in the page footer — previous/next arrows around
  the month name — and is the only way to change the month. Tapping the month
  name returns to the current month and is only offered when another month is
  shown.
- The table has no month header of its own; the selector names the month.
- Swiping horizontally does not change the month and does not navigate away
  from the table.
- Consecutive calendar weeks (Monday-first) alternate a visible row background
  so each week reads as a band; today's highlight still wins.
- Today's row is highlighted and its current entry is marked, matching the
  daily view.
- The table scrolls vertically inside the viewport; its date column stays
  visible while scrolling. The date column shows the day number and the short
  weekday name only; the month name is omitted because the month selector
  already shows it.
- The month is read through the Data port (`readMonth`); the shell formats the
  display-ready values with core.
- With no data the table shows the unavailable state; cached days render
  offline and mark the table stale.

### Prayer times graph (`/prayer-times/graph`)

- The graph plots the prayer entries as a line graph: the x axis is the date
  and the y axis is the time of day, with a line per entry.
- The range defaults to **year**; the page's footer offers **month** and
  **year** and steps backwards/forwards through the range. There is no week
  range on the page.
- The selected period is named above the chart — the month and year
  (`October 2026`) or the year alone (`2026`) — so the reader never has to
  infer it from the axis. It sits outside the stepper so a narrow screen cannot
  squeeze it.
- The range and its anchor are reflected in the address (`range`, `date`) as
  described under **Pages**.
- By default every entry is plotted. While all are shown, tapping a chip shows
  that entry alone; otherwise a chip toggles that entry in or out. Removing the
  last shown entry restores the default (all entries).
- Days with no data leave a gap in the line rather than a false point.
- Values more than 90 minutes from their entry's median are off-scale data
  errors (a time near midnight typed into the wrong field, say). The chart
  offers one **Hide off-scale** toggle, shown only while such values exist,
  with a count; it is off by default so the error stays visible, and when on it
  renders those points as gaps rather than guessing a replacement.
- The chart is read through the Data port (`readMonth`) and is stale when any
  day in the range is missing; the offline state renders cached days.
- The chart is decorative to assistive tech; a visually hidden table carries
  the same values, with off-scale points replaced by an em dash when hidden.

### Notifications

- The menu offers a device-notification toggle. Enabling it requests browser
  permission; the choice is stored on the device.
- When enabled, the app raises one notification 15 minutes before each prayer
  and one at the prayer time. `syuruk` never notifies.
- Notification titles and bodies are localised; the prayer time shown is the
  entry time for the selected district.
- Notifications use the service worker where available so they work while the
  installed PWA is running in the background. True background delivery without
  the app running is out of scope until a push backend exists.
- The toggle reflects the browser permission state: unsupported and blocked are
  shown as disabled/labelled states.
- The duration to the next entry renders in the primary colour when 15 minutes
  or less remain.

### Tasbih

- `/tasbih` is a page with a digital tasbih for zikir: a device drawn as SVG
  with a seven-segment LCD readout.
- The readout shows the count zero-padded to four digits (0–9999); the count
  never goes below zero and stops at 9999.
- The main round key increments by one. A reset key returns the count to zero;
  a decrement key subtracts one. Both side keys do nothing at their limits.
- Resetting a non-zero count asks for confirmation first, so an accidental tap
  cannot wipe a running zikir; confirming resets to zero and cancelling leaves
  the count untouched.
- Tapping anywhere on the page also increments, except on the reset and
  decrement keys and on links. Space/Enter do the same from the keyboard.
- Every increment, decrement, and reset requests a short device vibration where
  `navigator.vibrate` exists; unsupported devices are unaffected. An increment
  that lands on the notification step uses a longer, repeating pattern instead.
- A notification step defaults to 100 and is editable on the page (whole number,
  stored on the device). When device notifications are on, every increment that
  lands exactly on a multiple of the step raises a notification: step 100 rings
  at 100, 200, 300…; step 33 rings at 33, 66, 99…. Zero never rings.
- The page offers the same device-notification switch as the menu: enabling it
  requests permission and turns on the shared `wsb.notifications` preference, so
  prayer reminders and tasbih milestones share one choice. A blocked browser is
  labelled, not silently ignored.
- The count and the step are stored on the device, so a reload or a later visit
  resumes where the user left off; reset stores zero.
- The menu panel has a **Tasbih** entry that opens `/tasbih`; it closes the
  menu. The page links back to the app and is fully localized (Malay first).

### Downloads

- `/download` is a page listing the app for other platforms. Each platform is a
  card with its name, a short description, a status (available / coming soon)
  and a download action when available.
- The browser extension and the VS Code extension are available: each action
  downloads the artifact attached to the latest GitHub release (repository
  `lordsayur/wsb`), with its own install note.
- The TUI is available: its card shows the `curl … | sh` install command in a
  terminal block with a copy button, its action opens the latest GitHub
  release, and its install note offers `npx wsb-tui` as the no-install
  alternative, plus a screenshot of the real day/month/trend interfaces
  (`apps/web/public/tui-screenshot.png`). The screenshot opens full size on
  click in a modal dialog: Esc, the close button or a click on the backdrop
  dismiss it, and clicking the image toggles a 1:1 zoom at that point. Because a
  wide panorama cannot be pinched on every device, the enlarged view is also
  scrollable and drag-pannable, so a phone can read the whole image. The CLI is not a separate card —
  `wsb now`, `--json`, `--month` and piped output are part of the TUI shell.
  Raycast is listed as coming soon.
- The VS Code card also offers a "Get it on the Marketplace" action that opens
  the extension's VS Code Marketplace listing; the download action stays.
- The menu panel has a **Other platforms** entry that opens `/download`; it
  closes the menu.
- The page links back to the app, credits the MORA/KHEU source, and is fully
  localized (Malay first).

### Notifications page

- `/notifications` lists, newest first, a version notice for every app version
  newer than the one this device last acknowledged, and every active
  announcement. Each row shows its kind, title, body, date and, when it has
  one, a link.
- A version notice links to `/changelog`; the row's body is the newest change
  and the remaining changes follow as a list.
- Announcement text renders in the reader's locale, falling back to Malay and
  then to any locale that was written.
- Opening the page records a seen mark (`wsb.notificationsSeen`: the instant
  and the running version) so the unread dot clears on the next visit; the rows
  stay on screen for the current visit.
- A device with no seen mark counts only the running version as one new
  version, not the whole history, and counts every active announcement.
- An expired announcement is never shown and never counted.
- A failed announcement read shows the version notices only; the page never
  errors and never blocks.
- With nothing new the page shows an empty state, not an error.

### About page

- `/about` shows the running app version from the bundled changelog, marked
  **beta** while the version carries a prerelease suffix, and states the
  version the stable release will become.
- It links to the changelog, the notifications page, the other platforms and
  the privacy page, credits the data source, and links back to the app.
- No component hard-codes a version string.

### Changelog page

- `/changelog` renders every bundled changelog entry, newest first, with its
  version, localized date and changes, and marks the entry for the running
  version.

### Footer

- The footer shows the district selector on the left, filling the available
  width, a share button, and a menu button on the right. All three are aligned
  on one row and share the same height.
- The district selector is an inline radio group: one segmented button per
  district, with the current district highlighted. Left/Right arrows move
  between the options. It has no visible group label; its accessible name
  carries the "District" label instead.
- The menu button opens a panel with **Settings**, **Prayer times**,
  **Notifications**, **Tasbih**, **Quran verse**, **Other platforms** and
  **About**; it closes on Escape or after choosing an action.
- **Notifications** opens `/notifications` and carries a dot while something is
  unread, with a screen-reader label saying so.
- **About** opens `/about`; **Feedback** opens `/feedback` with the
  current page as `?from=`.
- Settings is a second panel reached from the menu, with a back entry. It
  contains the theme controls, the time-format choice, the language selector,
  the notification toggle, and the "reload data" and "reload app" actions.
  Escape returns to the menu, then closes.
- "Reload data" refetches the day from the source.
- "Reload app" reloads the page.
- Icons come from Nuxt Icon (`@nuxt/icon`, Lucide set): the menu, share,
  steppers, theme modes, notifications, downloads, and reload actions all use
  them, marked decorative when a text label is present.

### Time format

- Times render in 24-hour form by default; settings offer **24-hour** and
  **12-hour** choices, the latter showing an AM/PM marker.
- The chosen format applies everywhere times are shown or shared: the prayer
  rows, share text, and notifications.
- The choice survives a reload through a cookie (`wsb.timeFormat`) and is
  applied during SSR.
- Formatting stays in core (`formatTime` takes a `TimeFormat`); the shell only
  supplies the choice.

### Theme

- The app has two colour modes: **dark** (default) and **light**. The menu
  contains a mode toggle showing both options with the active one pressed.
- The default primary colour is yellow. The menu offers a set of preset
  palettes plus a custom palette chosen with a colour input; choosing a custom
  colour selects the custom palette automatically.
- The primary colour drives surfaces, borders, accents and the current-entry
  highlight through CSS custom properties; no component hard-codes a palette
  colour.
- The mode, palette id, and custom colour survive a reload, stored in cookies
  (`wsb.theme`, `wsb.palette`, `wsb.palette.custom`), and are applied during
  SSR so there is no flash of the wrong theme.
- The browser `theme-color` follows the active primary colour.
- Theme controls are labelled via translation keys; palette names are
  translation keys.

### Data source

- Prayer times come from Supabase through the Data port; the device cache is
  read first (offline first). MORA is imported into Supabase monthly by hand and
  is never read by the app at runtime.
- With no Supabase configuration the app shows the unavailable state.
- A small, muted link to the MORA/KHEU Brunei `WaktuSembahyang` page sits at the
  top of the page, centred, labelled via translation keys.

### Admin pages

- The admin surface is split into four separate, non-indexed pages, none
  linked from the app UI:
  - `/admin` — prayer times, the default page.
  - `/admin/analytics` — the analytics dashboard.
  - `/admin/settings` — appearance, time format and language preferences.
  - `/admin/notifications` — publish and delete announcements.
- All pages share one shell (`layouts/admin.vue`): a left menu listing every
  admin page (prayer times, analytics, settings, notifications) plus a link
  back to the app, and the signed-in account's email with **Sign out** at the
  top right. The menu marks the current page and gains an entry per new admin
  page without touching the pages themselves.
- The shell is the only scrolling container: the document itself does not
  scroll, so long tables scroll inside the content area rather than moving the
  menu and account. At narrow widths the left menu becomes a horizontal bar.
- Signed out, every page offers **Sign in with Google** (Supabase Auth) and
  nothing else. The OAuth redirect returns to the page that started it.
- Authorization belongs to the `admin` Edge Function (Data context): a
  signed-in account whose email is not in `admin_allowlist` sees a
  "not authorized" state and no data.
- All strings are translation keys, including result messages and all entry
  names.

### Admin prayer times

- An authorized admin picks a month, imports that Brunei month from MORA, and
  sees the month as a table with **one row per day**: the date, the Hijri date,
  and one editable time cell per stored entry (Imsak, Subuh, Syuruk, Dhuha,
  Zuhur, Asar, Maghrib, Isyak).
- Stored data is the Brunei & Muara base times; the district is not shown and
  not editable. Other districts stay a frontend offset in core.
- Cell edits are staged locally: changing a time marks the cell as pending and
  shows a count of unsaved changes. Nothing is written until the admin presses
  **Save**, which upserts every staged entry in one request; **Discard** clears
  the staged edits without writing. A blank cell drops its staged edit.
- Every import, list and update goes through the `admin` function; the shell
  never writes to Supabase directly and never holds a service-role key.

### Admin analytics

- `/admin/analytics` shows totals and previous-period change, a daily views
  series, top pages and event counts, and locale/device/referrer splits, over
  7, 30 or 90 days.
- The page reads production rows by default through the `analytics_stats` RPC;
  a toggle includes preview and development rows. A signed-in non-allowlisted
  account gets no data even if it calls the RPC directly.
- With no rows the page shows an empty state, not an error.

### Admin settings

- `/admin/settings` reaches the reader's own display preferences from the
  admin shell: the theme controls (mode, palette, custom colour), the time
  format, and the language selector. It sits behind the same Google sign-in
  gate as the other admin pages, so its content appears only for an allowlisted
  admin.
- The controls write the same cookies as the app footer's Settings panel, so a
  change here is a change in the app too. There is no second copy of the
  settings state.
- Notifications, reload data, reload app and privacy stay app-level actions in
  the footer's Settings panel; the admin page shows preferences only.

### Analytics

- The web shell records one `pageview` per route change, client-side only; SSR
  records nothing and the server never sees a visitor.
- A dev build always tags its events `development`, whatever the configured
  environment says, so a test build can never pass for production traffic.
- The plugin is a no-op when the environment is `development` (which a dev
  build always is) or when the Supabase URL or anon key is missing.
- A deliberate local test opts in with `NUXT_PUBLIC_ANALYTICS_DEV=1`.
- Only allowlisted `props` are sent: `month` for `/prayer-times`, `range` for
  `/prayer-times/graph` (`month` or `year`), `district` when it is not the
  default. Unknown query keys are dropped and the path is sent without its
  query string. The table and the graph are separate paths, so each view is
  counted on its own.
- `/admin` is never recorded: the client skips it and the database rejects it.
- No cookie, IP address, account id, user agent or full URL is collected. The
  session id lives in `sessionStorage` and dies with the tab.
- A failed send is dropped; nothing is queued or retried. The request uses
  `keepalive` so a page unload does not lose it.
- `/privacy` is a localized page linked from the footer menu (Settings) that
  states what is collected, what is not, and the 90-day retention.
- The footer's Settings panel ends with the privacy entry, after the reload
  actions, behind a divider.

### Share

- The share button sits between the district selector and the menu button,
  squeezed into the same footer row.
- A tap copies a formatted plain-text summary and confirms the copy to the user
  (localized, announced via a live region).
- A press-and-hold (or right-click / ArrowDown) opens a small menu offering
  **formatted** (default) or **raw** text.
- The summary includes the day name, both the Masihi and Hijri dates (each on
  its own line), the eight Brunei & Muara base times, and the district adjustment
  note ("add 1 minute for Tutong, 3 minutes for Belait").
- The title names the app only; the district appears once, on its own line.
- Formatted text separates the sections with blank lines; raw text is a dense
  single block with `|`-separated dates and no blank lines.
- The times always use the Brunei & Muara base entries, regardless of the
  selected district.
- The app's own URL always closes the summary.
- The URL is the running origin at click time, never hard-coded, so dev
  (routeup) and production (Netlify) each share their own address.

### Link previews

- Every page carries localized Open Graph and Twitter `summary_large_image`
  metadata so a pasted link previews as a rich card.
- All metadata URLs (canonical, `og:url`, image) derive from the request origin;
  none are hard-coded, so previews work on routeup, Netlify, and any deployment.
- The preview image is a static 1200×630 PNG (`/og-image.png`) matching the app's
  palette, with localized alt text.
- `og:locale` follows the active locale (`ms_BN`, else `en_US`).
- Canonical and `og:url` name the current route, not the site root, so each
  home slide previews and canonicalises as itself even though `/` redirects.

### District selection

- The district selector lives in the footer.
- When the user picks a district, call core to persist it and re-render.
- The selection is stored on the device and restored on the next visit.
- The displayed times always reflect the current selection.
- Brunei & Muara covers Temburong; a legacy Temburong selection renders the
  Brunei & Muara times.

### Offline

- When offline with cached data, render normally.
- When offline with no cache, render the empty state gracefully.
- The app ships as an installable PWA (manifest, icons, standalone display,
  app-shell precache) so it loads without a network after the first visit.

### First paint

- Offline first means cached times paint immediately on open: no full-page
  loading state when the device already has data.
- While cached data revalidates against the source, show a small inline
  updating hint beside the data; never hide the times or the header.
- The full loading state appears only when there is genuinely no cached data to
  show. A failed revalidation keeps the cached data on screen.
- The prayer-times table and graph follow the same rule using their cached
  month.

### Updates

- The service worker registers in `prompt` mode: a new build never takes over
  silently while the app is open.
- When a new service worker is waiting, show a visible, accessible update
  prompt ("reload" / "later"), localized via translation keys.
- Reload activates the waiting worker and reloads the page.
- Dismissing hides the prompt for the current session without forcing a reload.
- The browser checks for updates periodically (hourly) while the app is open.

### Pull to refresh

- Pulling down from the top on a touch device shows a resisted pull indicator
  ("pull down to reload" → "reloading…") and reloads the app past the
  threshold.
- The gesture is ignored on form controls, links and buttons, and the
  indicator is hidden when idle.

### Components (atomic design)

- Atoms/molecules are pure and prop-driven (prayer name, time text, district
  chip, icon; prayer row; district selector).
- Organisms compose them (prayer-time list, header/settings).
- Templates are layouts with slots, no data.
- Pages wire a template to core state.
- Every atom, molecule and organism ships with Storybook stories covering
  default, loading, error and edge values. Stories double as tests via `play`
  functions run headless in CI.

### Keyboard

- The app is usable without a pointer: every control is a native button, link,
  select or input, in DOM order, with a visible focus ring.
- A skip link is the first focus stop and moves focus to the main content.
- The prayer-times page nav is one tab stop: arrow keys move between entries,
  Home/End jump to the ends, and the current entry is marked.
- Menu, share menu and chart legend behave the same way: one tab stop, arrow
  keys walk the items, Home/End jump, Escape closes and returns focus to the
  trigger.
- The monthly table's scroll area is focusable so keyboard users can scroll it;
  it carries an accessible label.
- Focus never moves without a user action; closing a panel returns focus to the
  control that opened it.
- Shortcut keys never fire while focus is in a text field or over a menu.

## Invariants

- No domain rule is implemented in the shell. If a rule appears here, move it to
  core.
- No Supabase/vendor import in the shell; it talks to the Data port.
- Every user-facing string is a translation key. A hard-coded visible string is
  a bug.
- Malay is the default locale; every key exists in `ms` before it ships.
- A component without stories is unfinished.

## Acceptance criteria

- [ ] Loading renders the eight named entries for the default district with
      placeholder times, Imsak and Dhuha included.
- [ ] From Asar the list shows the four remaining prayers plus tomorrow's Imsak
      and Subuh.
- [ ] From Maghrib the Hijri date is tomorrow's.
- [ ] The day name is shown above the Masihi and Hijri dates.
- [ ] The Masihi and Hijri dates render side by side.
- [ ] The main section is centered and has no title or tagline.
- [ ] The footer has the district selector, share button, and menu button.
- [ ] Share copies Brunei & Muara times, both dates, the district note, and the
      app URL.
- [ ] Share confirms the copy to the user.
- [ ] Press-and-hold on share offers formatted (default) and raw text.
- [ ] Pulling down past the threshold reloads the app.
- [ ] The home opens on the last slide viewed, remembered across reloads; with
      no saved slide it opens the summary.
- [ ] A horizontal swipe moves to the next/previous slide and wraps at both
      ends; swiping over the district selector or the table does not navigate.
- [ ] `/summary`, `/today` and `/week` are separate routes, so analytics
      records three separate pages.
- [ ] The summary shows the next entry with its countdown and a progress bar,
      the day's eight entries in a grid, and a link to every prayer time.
- [ ] The weekly table puts the eight entries down the y axis and seven days
      across the x axis, marks today's column, and names its week.
- [ ] The weekly footer steps one week and returns to this week without
      leaving the slide.
- [ ] Rapid week stepping never leaves the table showing a different week's
      data than its header.
- [ ] Each route is canonical to itself; `/` is never the canonical target of a
      slide.
- [ ] The menu's Prayer times entry opens `/prayer-times`; both page tabs work
      and the old `/trend` address redirects to the graph.
- [ ] `/prayer-times` and `/prayer-times/graph` are separate routes, so
      analytics records them as separate pages.
- [ ] The table's month selector steps months in the footer and returns to the
      current month.
- [ ] The address reflects the district, month, graph range and anchor, and
      opening such a link restores it; malformed values fall back.
- [ ] The graph names the selected period above the chart for every range.
- [ ] The graph page does not scroll horizontally at 390px wide.
- [ ] Each prayer-times route is its own route bundle; the day page ships
      neither.
- [ ] The graph plots one line per entry with date on x and time on y.
- [ ] The graph range defaults to year and offers month and year.
- [ ] Every entry is plotted by default; tapping a legend chip filters to it.
- [ ] Days without data leave a gap in the graph line.
- [ ] Off-scale values are flagged and one toggle hides or shows them; the
      toggle only appears when such values exist.
- [ ] Every control is reachable and operable with the keyboard alone.
- [ ] Arrow keys move within the prayer-times nav, both menus and the chart
      legend; Escape closes a panel and restores focus.
- [ ] The eight daily entries scale to fill the space between header and
      controls without scrolling.
- [ ] The footer month selector steps to the previous/next month and back to
      this month; the district selector and share button are absent there.
- [ ] The month table lists every day of the selected month with all eight
      entries.
- [ ] Today's row and its current entry are highlighted in the month table.
- [ ] Consecutive Monday-first calendar weeks alternate a visible row
      background band.
- [ ] A pasted link exposes absolute Open Graph and Twitter image metadata.
- [ ] The menu opens Settings, Tasbih, and Other platforms.
- [ ] The tasbih count increments from any page tap, except the reset and
      decrement keys and links.
- [ ] The decrement key stops at zero; reset returns to zero; the count caps at
      9999.
- [ ] Resetting a non-zero count asks for confirmation; cancelling keeps it.
- [ ] Increment, decrement, and reset request a vibration where supported, with
      a distinct pattern on each milestone.
- [ ] The tasbih count and step survive a reload.
- [ ] Tasbih notifications ring on every multiple of the step (100 by default).
- [ ] Other platforms opens `/download`; the extension and TUI cards link to
      the latest GitHub release artifacts; Raycast is marked coming soon.
- [ ] The TUI card shows the terminal install command and copies it on demand,
      and shows the interface screenshot.
- [ ] Clicking the screenshot opens it in a modal; Esc, close and a backdrop
      click dismiss it.
- [ ] Clicking the enlarged image toggles 1:1 zoom; the enlarged view scrolls
      and pans by drag, so it is readable on a narrow screen and needs no pinch.
- [ ] The VS Code card links to the Marketplace listing and still offers the
      `.vsix` download.
- [ ] Settings opens the theme controls, time format, language, notifications,
      reload data, and reload app.
- [ ] 24-hour time is the default; 12-hour adds an AM/PM marker everywhere.
- [ ] The chosen time format survives a reload.
- [ ] Dark mode is the default; the toggle switches between dark and light.
- [ ] The default primary colour is yellow.
- [ ] Choosing a preset palette recolours the UI; a custom colour picks the
      custom palette.
- [ ] The chosen mode, palette, and custom colour survive a reload.
- [ ] Reload data refetches from the source; reload app reloads the page.
- [ ] The data source link renders at the top of the page, small and muted.
- [ ] The chosen district survives a reload.
- [ ] The chosen locale survives a reload.
- [ ] The current entry renders highlighted with a current marker; exactly one
      row is highlighted at a time.
- [ ] The next entry appears once as a card with a countdown line, its name and
      time on the next line, and an interval progress bar, placed between the
      current entry and the following one.
- [ ] The next entry's name and time use the same type size as every other row.
- [ ] Choosing a district updates the times and the address even when the page
      was opened with a different `?district=` link, and the choice survives a
      reload.
- [ ] From midnight until Subuh the day's Imsak and Subuh sit at the bottom of
      the list.
- [ ] For 20 minutes after an entry that entry's row shows how long ago it
      passed in place of the countdown, and Imsak is skipped.
- [ ] The loading / updating / offline status renders under the dates.
- [ ] Only the countdown line turns primary with 15 minutes or less remaining;
      the entry's name and time are never highlighted.
- [ ] The progress bar sits above the countdown line.
- [ ] Revalidating shows the spinner and updating hint in the separator above
      the card.
- [ ] Next day's Imsak and Subuh are separated by a dashed divider.
- [ ] The duration turns the primary colour with 15 minutes or less remaining.
- [ ] Enabling notifications requests permission and persists the choice.
- [ ] Notifications fire at each prayer and 15 minutes before; syuruk never
      notifies.
- [ ] A duration under 60 seconds renders in seconds.
- [ ] The page fits the viewport without scrolling.
- [ ] The viewport disables pinch-zoom and double-tap zoom.
- [ ] The highlight and duration refresh as time passes.
- [ ] Selecting Tutong shifts every entry +1 minute versus default.
- [ ] Selecting Belait shifts every entry +3 minutes versus default.
- [ ] A legacy Temburong selection renders Brunei & Muara times.
- [ ] Offline with cache renders the last known good times.
- [ ] Opening the app with cached data shows the times immediately, with only a
      small inline updating hint during revalidation.
- [ ] Offline without cache renders an empty state, not a crash.
- [ ] The MORA/KHEU source link is visible and localized.
- [ ] A waiting service worker shows a localized reload prompt.
- [ ] Reload activates the waiting worker; "later" leaves the app running.
- [ ] Every shared component has stories covering default/loading/error/edge.
- [ ] Default locale is `ms`; switching to `en` re-renders all visible text.
- [ ] Switching to `ar` or `ms-Arab` re-renders all text in Arabic script and
      flips the layout to right-to-left.
- [ ] Arabic-script locales render in the Noto Naskh Arabic webfont.
- [ ] Dates and Hijri dates render in Arabic script for `ar` and `ms-Arab`.
- [ ] Times, dates and durations render with Arabic-Indic digits for `ar` and
      `ms-Arab`, while Latin locales keep Latin digits.
- [ ] The chosen Arabic-script locale survives a reload.
- [ ] No visible literal strings exist outside the locale files.
- [ ] A missing `ms` key fails the check before shipping.
- [ ] `/admin` signed out shows only the Google sign-in action, with the admin
      menu and no account panel until signed in.
- [ ] A signed-in non-allowlisted account sees the not-authorized state with no
      records.
- [ ] An allowlisted admin imports a month and sees one row per day, with the
      eight entries as editable time cells and no district column.
- [ ] The admin menu switches between `/admin` and `/admin/analytics` without
      losing the session, and the signed-in email sits at the top right with a
      working sign out.
- [ ] A tall month table scrolls inside the content area while the menu and the
      account stay fixed.
- [ ] Editing one cell stages it, shows the pending count, writes nothing until
      **Save**, and then reloads the month with the new value; **Discard**
      clears staged edits.
- [ ] Every admin page (`/admin`, `/admin/analytics`, `/admin/settings`,
      `/admin/notifications`) carries a `noindex` robots meta tag and is
      reachable from the shared menu.
- [ ] The admin menu offers `/admin/settings`, which changes the theme, time
      format and language through the same controls and cookies as the app
      footer.
- [ ] A route change records one `pageview` with the route path and no query
      string.
- [ ] With `import.meta.dev`, environment `development`, or missing Supabase
      config, no pageview is sent.
- [ ] Only allowlisted `props` are sent; unknown query keys are dropped.
- [ ] Visiting any admin page records nothing.
- [ ] `/admin/analytics` renders totals, a daily series and the splits for
      production, and an empty state with no rows.
- [ ] The analytics panel's toggle includes preview and development rows.
- [ ] `/privacy` is reachable from the footer menu and fully localized.
- [ ] `/notifications` lists a newer version notice and an active announcement,
      and the footer's notification entry shows an unread dot until the page is
      opened.
- [ ] An expired announcement never appears in `/notifications`.
- [ ] `/about` shows the bundled version and marks it beta while it is a
      prerelease.
- [ ] `/changelog` renders every entry newest first and marks the running
      version.
- [ ] `/admin/notifications` publishes and deletes announcements behind the
      admin gate.
- [ ] `/about` and `/changelog` carry no hard-coded version string.
- [ ] The footer menu offers `/feedback`, which needs no sign-in and is
      reachable from `/about` too.

## Interfaces

None published. Consumes core and the Data port.

## Out of scope

- Business logic — core.
- Backend access — Data adapter.
- Additional shells (extension, TUI/CLI) — their own specs when built.

## Changelog

- 2026-10-04 — initial draft, extracted from `VISION.md`.
- 2026-10-18 — show the MORA/KHEU data source link on every render.
- 2026-10-18 — installable PWA with a prompted reload when a new build waits.
- 2026-10-18 — highlight the current entry and show the duration to the next,
  refreshed live.
- 2026-10-18 — show both Masihi and Hijri dates.
- 2026-10-18 — remove the header; center the main section; move district and
  language controls into a two-section footer with a menu.
- 2026-10-18 — show sub-minute durations in seconds; fit the page to the
  viewport with no scrolling.
- 2026-10-18 — move the data source link to the top of the page, smaller and
  muted; maximize the district selector.
- 2026-10-18 — add a share button that copies Brunei & Muara times, the district
  adjustment note, and the live app URL.
- 2026-10-18 — localized Open Graph/Twitter metadata and a 1200×630 preview
  image for rich link cards.
- 2026-10-18 — share text carries the Hijri date, breathing room, and a
  hold-for-raw-text option; pull down to reload the app.
- 2026-10-18 — dark/light mode toggle (dark default), yellow primary colour,
  preset and custom palettes, persisted in cookies and applied during SSR.
- 2026-10-18 — footer controls share a baseline; district label removed;
  Temburong folded into Brunei & Muara, leaving three options.
- 2026-10-18 — add a Settings panel for theme, time format, language, and
  notifications; add 12/24-hour time rendering.
- 2026-10-18 — opt-in device notifications 15 minutes before and at each
  prayer; next-prayer duration turns primary with 15 minutes left.
- 2026-10-19 — add the non-indexed `/admin` page: Google sign-in gated by the
  Data context's allowlist, monthly MORA import, and per-record time edits via
  the `admin` Edge Function.
- 2026-10-18 — add an Other platforms downloads page; the browser extension
  installs from the latest GitHub release.
- 2026-10-19 — add Arabic (`ar`) and Jawi Malay (`ms-Arab`) locales with an
  Arabic-script webfont, right-to-left layout, and Arabic-script dates.
- 2026-10-19 — add horizontal swipe navigation and a monthly prayer table; show
  Dhuha in both views.
- 2026-10-20 — move month navigation into the footer, replacing the district
  selector and share button while the monthly view is open.
- 2026-10-20 — show Imsak as the first entry in the day, month and share views.
- 2026-10-20 — maximise the daily prayer text, disable zoom, add wrapping pages
  with top page indicators, and band the month table by calendar week.
- 2026-10-20 — add a trend chart page: prayer times over date, week/month/year
  range, per-entry filtering.
- 2026-10-20 — paint cached times immediately on open and show only a small
  inline hint while revalidating.
- 2026-10-20 — full-width month and trend views on non-mobile screens.
- 2026-10-20 — add a Hide off-scale toggle to the trend chart and make the app
  keyboard-first.
- 2026-10-20 — add a `/tasbih` page: SVG digital tasbih with increment (whole
  page), decrement, reset, and vibration.
- 2026-10-20 — adopt Nuxt Icon (Lucide) for menu, controls, and actions.
- 2026-10-20 — mark the VS Code extension available on the downloads page with
  its own `.vsix` link and install note.
- 2026-10-21 — add a Marketplace action to the VS Code card, keeping the
  `.vsix` download.
- 2026-10-21 — make the district selector an inline radio group, squeezed into
  the footer row beside the share and menu buttons.
- 2026-10-21 — keep the eight prayer rows and their names on screen while the
  day loads, with muted placeholder times, so the first open is never blank.
- 2026-10-21 — add tasbih milestone notifications on every multiple of a
  device-stored step (default 100), sharing the prayer notification preference.
- 2026-10-21 — persist the tasbih count and step, vibrate distinctly on each
  milestone, and confirm before resetting a non-zero count.
- 2026-10-22 — move the trend chart to its own `/trend` page opened from the
  menu, so the main page does not ship the chart; keep the day and month on one
  cached month, and mirror the view and selection in the address.
- 2026-10-22 — mark the TUI available on the downloads page with the
  `curl … | sh` install note and the `npx wsb-tui` alternative.
- 2026-10-22 — show the TUI install command in its card with a copy button.
- 2026-10-22 — drop the separate CLI card; `wsb now` and the piped/JSON modes
  belong to the TUI shell.
- 2026-10-22 — the TUI card shows a screenshot of the day, month and trend
  views, generated from the TUI renderer.
- 2026-10-22 — the TUI screenshot opens in a click-to-zoom modal that needs no
  pinch gesture: 1:1 zoom on click, plus scrolling and drag-panning.
- 2026-10-22 — name the selected period beside the trend stepper.
- 2026-10-22 — move the trend period caption above the chart so it does not
  crowd the stepper on a phone, and clip the hidden a11y table so it stops
  widening the page.
- 2026-10-24 — record cookieless pageviews client-side, gate them to
  production, and surface the aggregates in an `/admin` panel; add `/privacy`.
- 2026-10-25 — split `/admin` into prayer times (`/admin`, one row per day,
  district removed) and `/admin/analytics`.
- 2026-10-31 — move the next-prayer countdown from above the list to directly
  below the highlighted current entry.
- 2026-10-31 — phase the daily list (all entries until Zuhur ends, then the
  remaining prayers plus tomorrow's Imsak and Subuh) and roll the Hijri date to
  tomorrow from Maghrib.
- 2026-10-31 — redesign the countdown as a NextPrayer card with an interval
  progress bar; separate next-day rows with a divider.
- 2026-10-31 — merge the countdown into the next entry's row: countdown strip
  above the name/time, no duplicate prayer name or "next" label, and the
  updating hint moves into the strip.
- 2026-10-31 — show the next entry as one card ("until <entry>" plus its time)
  in place of its row, separated from the current entry by a line that carries
  the refresh spinner.
- 2026-10-31 — move today's Imsak and Subuh to the bottom from midnight until
  Subuh; split the next-entry card into a small countdown line above the name
  and time.
- 2026-10-31 — one type size for every entry including the next one, larger
  countdown, no dashed dividers, and the day's status line moved under the
  dates.
- 2026-10-31 — stop highlighting the next entry (only the countdown turns
  yellow), move the progress bar above the countdown, and fix the district
  selector snapping back to the district named in the link.
- 2026-10-31 — report the passed entry for 20 minutes after its time (Imsak
  excepted) in place of the next-entry countdown.
- 2026-10-31 — merge the countdown into the current entry's row as a second
  line, drop the separate card, the progress bar and the repeated prayer name.
- 2026-11-01 — move the countdown line under the next entry's row instead of the
  current one.
- 2026-11-01 — put the countdown and passed notes inline beside the time instead
  of on a second line.
- 2026-11-02 — move the monthly table off `/` onto its own `/prayer-times` page
  with a **Table / Graph** header nav, move the chart there as
  `/prayer-times/graph`, default the graph to the year with month/year ranges,
  give every route an English path, and redirect `/trend` to the graph so each
  view is counted separately in analytics.
- 2026-11-02 — split the home into three swipeable slides (summary, today,
  weekly), each its own route so analytics counts them apart; `/` reopens the
  last viewed slide from a cookie.
- 2026-11-04 — add `/admin/settings`, reachable from the admin menu, reusing
  the footer's theme, time-format and language controls and their cookies.
- 2026-11-04 — admin pages are four now: prayer times, analytics, settings and
  notifications.
- 2026-11-04 — add `/about` (running version, beta marker, links), `/changelog`
  (the bundled record) and `/notifications` (version notices plus admin
  announcements, with an unread dot in the menu).
- 2026-11-04 — add `/admin/notifications` to publish and delete announcements.
- 2026-11-04 — the app version and changelog come from one bundled record; see
  [`../release/spec.md`](../release/spec.md).

- 2026-11-04 — add `/feedback`, filed as a GitHub issue by the server so no
  GitHub account is needed; linked from the footer menu and `/about`.
