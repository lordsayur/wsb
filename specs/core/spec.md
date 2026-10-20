# Prayer Times — spec

- **Status:** active
- **Context:** core domain
- **Code:** `packages/core` (currently `packages/shared`, being split)
- **Depends on:** Data (port only)

## Purpose

Own every rule of Brunei prayer times: which districts exist, how each district
adjusts the default times, which prayers are shown, and how the user's district
selection is validated. Platform-agnostic, pure TypeScript. This is the thick
core that all shells render.

## Ubiquitous language

See [`../glossary.md`](../glossary.md). Owned terms: *District*, *Prayer*,
*Prayer times*, *Offset*, *Selection*.

> **Legacy parity.** The old app's rules are in
> [`../legacy/business-rules.md`](../legacy/business-rules.md) with dispositions
> in [`../legacy/parity.md`](../legacy/parity.md). OPEN-1 (prayer set) is
> resolved: eight entries, Imsak and Dhuha included. OPEN-5 (Isya vs isyak)
> keeps the canonical identifier `isyak`.

## Behavior

### Districts

- The system defines exactly three districts: Brunei & Muara (which covers
  Temburong), Tutong, Belait.
- The default district is Brunei & Muara.
- The legacy standalone Temburong value still resolves to Brunei & Muara.

### Offsets

- When the district is Tutong, add +1 minute to every default time.
- When the district is Belait, add +3 minutes to every default time.
- Otherwise add 0 minutes.
- Base times come from the MORA source (KHEU Brunei) and are stored as
  Brunei & Muara values; offsets are the only adjustment core makes.
- If an offset produces a time past midnight, wrap to the next day (or keep the
  clock value and flag the day rollover — see OPEN).

### Prayers shown

- The system exposes the eight entries in order: imsak, subuh, syuruk, doha,
  zuhur, asar, maghrib, isyak.
- `imsak`, `syuruk` and `doha` (Dhuha) are displayed but are not obligatory
  prayers.

### Selection

- When a selection exists and names a known district, use it.
- When no selection exists, or it names an unknown district, fall back to the
  default district and never throw.
- Persisting the selection is delegated to the Data port; core defines the
  contract, not the storage.

### Time math

- Prayer times are computed/stored for the default district and adjusted by
  offset. Core is the only place offsets are applied.
- Formatting for display is pure and locale-explicit; core returns
  display-ready values, shells do not re-format.
- Time formatting takes an explicit 12/24-hour choice and defaults to 24-hour.

### Dates

- The resolved day carries both calendars: the Masihi (Gregorian) date and the
  Hijri date.
- The Hijri date is the authoritative value supplied by the source (MORA
  `Tarikh`); core does not reinterpret it.
- When the source has no Hijri value, core derives one from the Gregorian date
  using the Umm al-Qura calendar for the active locale.
- Gregorian dates are formatted in core for an explicit locale, like times.
- The day name is formatted in core for an explicit locale, in long or short
  form.
- A day of the month formats in core for an explicit locale, without the month
  name.
- A compact day + short month label formats in core for chart axes.

### Trend ranges

- The trend chart is anchored on a Brunei date and shows one of three ranges:
  **week** (the Monday-first week containing the anchor), **month** (the whole
  Brunei calendar month), or **year** (the whole calendar year).
- A range resolves to inclusive ISO start and end dates.
- The anchor can step forward and back by one range (a week, a month, a year).
- A range is *current* when it has the same start as the range containing
  today.
- A chart value is *off-scale* when it differs from its entry's median over the
  range by more than 90 minutes; that is a data-entry error, not a seasonal
  change. The shell may hide off-scale values and must not invent replacements.
- Arabic-script locales (`ar`, `ms-Arab`) format times, dates and the Hijri
  date with Arabic-Indic digits; all other locales use Latin digits.

### Current and next entry

- "Now" is the Brunei wall-clock time (UTC+8), regardless of the device's
  timezone.
- The **current entry** is the last entry in the documented order (including
  `imsak`, `syuruk` and `doha`) whose time has passed today. Before the first
  entry there is no current entry for today's list: the active interval began
  yesterday with `isyak`.
- The **next entry** is the entry after the current one in the documented
  order, wrapping from `isyak` back to `imsak`; before `imsak` it is `imsak`.
- The **duration to next** is the clock difference from now to the next entry,
  wrapping past midnight. It is non-negative and less than 24 hours.
- `imsak`, `syuruk` and `doha` participate as time boundaries even though they
  are not obligatory prayers.
- Duration is resolved in core as a non-negative second count; the shell renders
  it with translated unit labels (all visible text stays in the locale files).
  Durations under one minute are shown in seconds; a whole minute is the
  smallest minute unit otherwise.

### Reminders

- Core resolves upcoming reminders for the next 24 hours: one 15 minutes before
  each prayer and one at the prayer's time. `imsak`, `syuruk` and `doha` are
  not obligatory prayers and get no reminder.
- Each reminder carries the prayer, the kind (`lead` or `due`), the event time,
  and the non-negative seconds from now (rolling past midnight).
- Reminders are ordered nearest first; core computes the schedule, the shell
  decides how to present it.

## Invariants

- Applying an offset is idempotent per input: same district + same base time =
  same adjusted time.
- Unknown district never yields undefined times; it yields the default.
- `imsak` is always present and comes first; `syuruk` is always ordered between
  subuh and zuhur; `doha` follows `syuruk` and precedes `zuhur`.
- Core imports nothing from shells or adapters.

## Acceptance criteria

- [ ] Selecting each of the three districts yields the documented offset.
- [ ] The legacy Temburong value resolves to Brunei & Muara.
- [ ] Tutong is exactly 1 minute later on every entry.
- [ ] Belait is exactly 3 minutes later on every entry.
- [ ] A missing selection resolves to Brunei & Muara.
- [ ] An unknown district resolves to Brunei & Muara and does not throw.
- [ ] The eight entries are returned in the documented order.
- [ ] `imsak` comes first; `syuruk` appears between subuh and zuhur; `doha`
      follows `syuruk`.
- [ ] Before imsak, there is no current entry for today and the next is imsak.
- [ ] Between entries, the current entry is the last one whose time has passed.
- [ ] The duration to the next entry wraps past midnight and is under 24h.
- [ ] Duration is a non-negative second count under 24 hours.
- [ ] A duration under 60 seconds is reported in seconds.
- [ ] Reminders are scheduled 15 minutes before and at each of the five prayers.
- [ ] Imsak, Syuruk and Dhuha have no reminder.
- [ ] Reminder durations roll past midnight and are ordered nearest first.
- [ ] Gregorian dates format for an explicit locale.
- [ ] Times format in 24-hour by default and in 12-hour with an AM/PM marker
      when asked.
- [ ] The day name formats for an explicit locale, long and short.
- [ ] A day of the month formats alone, without the month name.
- [ ] A missing Hijri value falls back to the Umm al-Qura calendar.
- [ ] A value more than 90 minutes from its entry's median is off-scale.

## Interfaces

Names only; shapes finalized in code.

- `District` — union of the three district names.
- `PrayerName` — union of the eight entries.
- `PrayerTimes` — resolved times for a date + district.
- `Selection` — the persisted choice.
- `PrayerProgress` — current entry, next entry, and duration to next.
- `PrayerNotification` / `notificationSchedule` — upcoming lead and due
  reminders.
- `formatDate` / `formatHijriDate` / `formatWeekday` — locale-explicit date
  formatting.
- `monthOf` / `shiftMonth` / `monthDates` / `formatMonth` / `formatDayNumber` —
  month navigation and formatting for the monthly view.
- `shiftDate` / `rangeDates` / `formatShortDate` / `chartBounds` /
  `shiftChartDate` / `chartIsCurrent` / `chartMedian` / `isChartOutlier` —
  trend chart ranges, labels, and off-scale detection.
- Resolve selection → district; apply offset; format times.
- Resolve now → current/next entry and duration; format duration.

## Out of scope

- Fetching or caching data — Data context.
- Rendering — shells.
- The astronomy of computing raw prayer times if sourced remotely; core merely
  adjusts and formats. OPEN: if times are computed locally, this context owns
  the algorithm.

## Changelog

- 2026-10-04 — initial draft, extracted from `VISION.md`.
- 2026-10-18 — base times sourced from MORA/KHEU; core only applies district
  offsets.
- 2026-10-18 — resolve current/next entry and duration to next (Brunei clock,
  wraps midnight); format duration in core.
- 2026-10-18 — carry and format both Masihi and Hijri dates.
- 2026-10-18 — format the day name.
- 2026-10-18 — resolve duration in seconds; show sub-minute durations in
  seconds.
- 2026-10-18 — resolve reminder schedule: 15 minutes before and at each
  prayer.
- 2026-10-19 — add Dhuha (`doha`) as a displayed, non-reminding entry. Adds
  month navigation and formatting helpers.
- 2026-10-20 — expose Imsak (`imsak`) as the first displayed entry; it is a
  non-reminding time boundary like Dhuha.
- 2026-10-20 — add trend range helpers (week/month/year bounds, stepping, and
  compact axis labels).
- 2026-10-20 — detect off-scale chart values against the entry's median.
