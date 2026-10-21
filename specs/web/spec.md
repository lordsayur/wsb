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
  side by side, the duration to the next entry, then the prayer times.
- There is no title or tagline in the UI.
- Show all eight entries in order, labelled (Imsak, Subuh, Syuruk, Dhuha,
  Zuhur, Asar, Maghrib, Isyak). The names and rows are always on screen: while
  loading or unavailable their times render as a muted placeholder, so opening
  the app never shows a blank sheet.
- Highlight the current entry (from core's current/next progress) with a visible
  style and an accessible current marker.
- Show the duration to the next entry, labelled with the next entry's name.
- Durations under one minute render in seconds; otherwise in whole minutes (and
  hours when non-zero).
- The highlight and duration update while the app is open, without a reload.
- The whole page fits the viewport without scrolling, at any screen size.
  The monthly view scrolls inside its table, never the page.
- On non-mobile screens (768px and wider) the monthly view and the trend chart
  use the full width of the screen; the daily view keeps its compact centred
  column.
- The daily view maximises the prayer text: the eight entries share the space
  left between the header and the controls, with their labels and times scaled
  to the available height.
- Browser zoom is disabled: the viewport forbids user scaling and touch
  gestures do not pinch-zoom the page.
- When data is unavailable, show an empty/offline state; never a blank crash.

### Pages

- The shell has three pages: the daily view, the monthly view, and the trend
  chart.
- Swiping horizontally, or tapping a page indicator, cycles between them in
  either direction; the cycle wraps around.
- A row of circular page indicators sits at the top of the page; the current
  page's circle is highlighted and carries an accessible current marker.

### Monthly view

- A horizontal swipe switches between the daily view and a monthly view:
  swiping right shows the month, swiping left returns to the day. Vertical
  drags and drags starting on form controls are ignored.
- Consecutive calendar weeks (Monday-first) alternate a visible row background
  so each week reads as a band; today's highlight still wins.
- The monthly view shows one row per day of the selected Brunei month with the
  eight entry columns, so the whole month is visible at a glance.
- In the monthly view the footer replaces the district selector and share
  button with a month selector: previous/next arrows around the month name.
  Tapping the month name returns to the current month and is only offered when
  another month is shown.
- The month selector lives only in the footer; the table has no header of its
  own.
- Today's row is highlighted and its current entry is marked, matching the
  daily view.
- The table scrolls vertically inside the viewport; its date column stays
  visible while scrolling. The date column shows the day number and the short
  weekday name only; the month name is omitted because the month selector
  already shows it.
- The month is read through the Data port (`readMonth`); the shell formats the
  display-ready values with core.
- With no data the view shows the unavailable state; cached days render
  offline and mark the view stale.

### Trend chart

- The trend page plots the prayer entries as a line graph: the x axis is the
  date and the y axis is the time of day, with a line per entry.
- The range defaults to **month**; the footer offers **week**, **month** and
  **year** and steps backwards/forwards through the range. In the trend view
  the footer replaces the district selector and share button with the range
  selector.
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
- Tapping anywhere on the page also increments, except on the reset and
  decrement keys and on links. Space/Enter do the same from the keyboard.
- Every increment, decrement, and reset requests a short device vibration where
  `navigator.vibrate` exists; unsupported devices are unaffected.
- The count is kept for the open tab, so leaving the page and coming back keeps
  it.
- The menu panel has a **Tasbih** entry that opens `/tasbih`; it closes the
  menu. The page links back to the app and is fully localized (Malay first).

### Downloads

- `/download` is a page listing the app for other platforms. Each platform is a
  card with its name, a short description, a status (available / coming soon)
  and a download action when available.
- The browser extension and the VS Code extension are available: each action
  downloads the artifact attached to the latest GitHub release (repository
  `lordsayur/wsb`), with its own install note. CLI, TUI and Raycast are listed
  as coming soon.
- The VS Code card also offers a "Get it on the Marketplace" action that opens
  the extension's VS Code Marketplace listing; the download action stays.
- The menu panel has a **Other platforms** entry that opens `/download`; it
  closes the menu.
- The page links back to the app, credits the MORA/KHEU source, and is fully
  localized (Malay first).

### Footer

- The footer shows the district selector on the left, filling the available
  width, a share button, and a menu button on the right. All three are aligned
  on one row and share the same height. In the monthly view the selector and
  share button are replaced by the month selector.
- The district selector is an inline radio group: one segmented button per
  district, with the current district highlighted. Left/Right arrows move
  between the options. It has no visible group label; its accessible name
  carries the "District" label instead.
- The menu button opens a panel with **Settings**, **Tasbih**, and **Other
  platforms**; it closes on Escape or after choosing an action.
- Settings is a second panel reached from the menu, with a back entry. It
  contains the theme controls, the time-format choice, the language selector,
  the notification toggle, and the "reload data" and "reload app" actions.
  Escape returns to the menu, then closes.
- "Reload data" refetches the current view (day, month, or trend) from the
  source.
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

### Admin page

- `/admin` is a separate, non-indexed page for maintaining the stored prayer
  data. It is not linked from the app UI.
- Signed out, it offers **Sign in with Google** (Supabase Auth) and nothing
  else. The OAuth redirect returns to `/admin`.
- Authorization belongs to the `admin` Edge Function (Data context): a
  signed-in account whose email is not in `admin_allowlist` sees a
  "not authorized" state and no data.
- An authorized admin picks a month, imports that Brunei month from MORA, and
  sees the month's stored records; each row's time can be edited and saved.
- Every import, list and update goes through the `admin` function; the shell
  never writes to Supabase directly and never holds a service-role key.
- All strings are translation keys, including result messages and all entry
  names.

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
- The monthly and trend pages follow the same rule using their cached month.

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
- Page indicators are one tab stop: arrow keys move and switch page,
  Home/End jump to the ends.
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
- [ ] The day name is shown above the Masihi and Hijri dates.
- [ ] The Masihi and Hijri dates render side by side.
- [ ] The main section is centered and has no title or tagline.
- [ ] The footer has the district selector, share button, and menu button.
- [ ] Share copies Brunei & Muara times, both dates, the district note, and the
      app URL.
- [ ] Share confirms the copy to the user.
- [ ] Press-and-hold on share offers formatted (default) and raw text.
- [ ] Pulling down past the threshold reloads the app.
- [ ] Swiping right from the day shows the month; swiping left returns.
- [ ] Swiping past either edge cycles back to the other page.
- [ ] Tapping a page indicator switches pages and highlights that circle.
- [ ] The trend page plots one line per entry with date on x and time on y.
- [ ] The trend range defaults to month and offers week and year.
- [ ] Every entry is plotted by default; tapping a legend chip filters to it.
- [ ] Days without data leave a gap in the trend line.
- [ ] Off-scale values are flagged and one toggle hides or shows them; the
      toggle only appears when such values exist.
- [ ] Every control is reachable and operable with the keyboard alone.
- [ ] Arrow keys move within the page indicators, both menus and the chart
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
- [ ] Increment, decrement, and reset request a vibration where supported.
- [ ] Other platforms opens `/download`; the extension cards link to the latest
      GitHub release artifacts; other platforms are marked coming soon.
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
- [ ] The duration to the next entry renders, labelled with the next entry.
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
- [ ] `/admin` signed out shows only the Google sign-in action.
- [ ] A signed-in non-allowlisted account sees the not-authorized state with no
      records.
- [ ] An allowlisted admin imports a month and sees its records.
- [ ] Editing one row's time saves it and the changed value comes back on the
      next list.
- [ ] `/admin` carries a `noindex` robots meta tag.

## Interfaces

None published. Consumes core and the Data port.

## Out of scope

- Business logic — core.
- Backend access — Data adapter.
- Additional shells (extension, CLI, TUI) — their own specs when built.

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
