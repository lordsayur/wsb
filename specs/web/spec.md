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
- Show all six entries in order, labelled.
- Highlight the current entry (from core's current/next progress) with a visible
  style and an accessible current marker.
- Show the duration to the next entry, labelled with the next entry's name.
- Durations under one minute render in seconds; otherwise in whole minutes (and
  hours when non-zero).
- The highlight and duration update while the app is open, without a reload.
- The whole page fits the viewport without scrolling, at any screen size.
- When data is unavailable, show an empty/offline state; never a blank crash.

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

### Downloads

- `/download` is a page listing the app for other platforms. Each platform is a
  card with its name, a short description, a status (available / coming soon)
  and a download action when available.
- The browser extension is listed first and is available: its action downloads
  the extension zip attached to the latest GitHub release (repository
  `lordsayur/wsb`). CLI, TUI, VS Code extension, Raycast and terminal surfaces
  are listed as coming soon.
- The menu panel has a **Other platforms** entry that opens `/download`; it
  closes the menu.
- The page links back to the app, credits the MORA/KHEU source, and is fully
  localized (Malay first).

### Footer

- The footer shows the district selector on the left, filling the available
  width, a share button, and a menu button on the right. All three are aligned
  on one row and share the same height.
- The district selector has no visible label; its accessible name carries the
  "District" label instead.
- The menu button opens a panel with a **Settings** entry plus "reload data"
  and "reload app"; it closes on Escape or after choosing an action.
- Settings is a second panel reached from the menu, with a back entry. It
  contains the theme controls, the time-format choice, the language selector,
  and the notification toggle. Escape returns to the menu, then closes.
- "Reload data" refetches the day's prayer times from the source.
- "Reload app" reloads the page.

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

### Share

- The share button sits between the district selector and the menu button.
- A tap copies a formatted plain-text summary and confirms the copy to the user
  (localized, announced via a live region).
- A press-and-hold (or right-click / ArrowDown) opens a small menu offering
  **formatted** (default) or **raw** text.
- The summary includes the day name, both the Masihi and Hijri dates (each on
  its own line), the six Brunei & Muara base times, and the district adjustment
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

## Invariants

- No domain rule is implemented in the shell. If a rule appears here, move it to
  core.
- No Supabase/vendor import in the shell; it talks to the Data port.
- Every user-facing string is a translation key. A hard-coded visible string is
  a bug.
- Malay is the default locale; every key exists in `ms` before it ships.
- A component without stories is unfinished.

## Acceptance criteria

- [ ] Loading renders the six entries for the default district.
- [ ] The day name is shown above the Masihi and Hijri dates.
- [ ] The Masihi and Hijri dates render side by side.
- [ ] The main section is centered and has no title or tagline.
- [ ] The footer has the district selector, share button, and menu button.
- [ ] Share copies Brunei & Muara times, both dates, the district note, and the
      app URL.
- [ ] Share confirms the copy to the user.
- [ ] Press-and-hold on share offers formatted (default) and raw text.
- [ ] Pulling down past the threshold reloads the app.
- [ ] A pasted link exposes absolute Open Graph and Twitter image metadata.
- [ ] The menu opens Settings, Other platforms, reload data, and reload app.
- [ ] Other platforms opens `/download`; the extension card links to the latest
      GitHub release artifact; other platforms are marked coming soon.
- [ ] Settings opens the theme controls, time format, language, and
      notifications.
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
- [ ] The highlight and duration refresh as time passes.
- [ ] Selecting Tutong shifts every entry +1 minute versus default.
- [ ] Selecting Belait shifts every entry +3 minutes versus default.
- [ ] A legacy Temburong selection renders Brunei & Muara times.
- [ ] Offline with cache renders the last known good times.
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
- 2026-10-18 — add an Other platforms downloads page; the browser extension
  installs from the latest GitHub release.
- 2026-10-19 — add Arabic (`ar`) and Jawi Malay (`ms-Arab`) locales with an
  Arabic-script webfont, right-to-left layout, and Arabic-script dates.
