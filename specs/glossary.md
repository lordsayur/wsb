# Glossary — ubiquitous language

One definition per term, used by every spec and the code. If a term is missing,
add it here before using it. Names are the domain's, not the implementation's.

## District

A prayer-time region in Brunei. There are three:

| District | Offset from default |
| --- | --- |
| Brunei & Muara (covers Temburong) | 0 (this is the default) |
| Tutong | +1 minute |
| Belait | +3 minutes |

**Default district** is Brunei & Muara. The legacy standalone Temburong value
maps to Brunei & Muara.

## Prayer

One of the five daily prayers, in order:

1. `subuh` — Fajr / dawn
2. `syuruk` — sunrise (not a prayer, marks the end of Subuh)
3. `zuhur` — Dhuhr / noon
4. `asar` — Asr / afternoon
5. `maghrib` — sunset
6. `isyak` — Isha / night

## Prayer times

The set of times for the six entries above, for a given date and district.
Adjusted by the district offset, then formatted for display.

## Offset

A fixed per-district minute adjustment applied to the default times.
`+1` for Tutong, `+3` for Belait, `0` otherwise.

## Time format

The clock form used to render times: 24-hour (default) or 12-hour. Owned by
core's `formatTime`; the shell only supplies the user's choice.

## Selection

The user's chosen district, persisted on the device (localStorage) through the
Data port. The app renders the selection; when absent it falls back to the
default district.

## Current entry

The last entry in the day's order whose time has passed at the Brunei
wall-clock time. Before Subuh it is the previous day's Isyak. `syuruk` counts as
a boundary even though it is not a prayer.

## Next entry

The entry after the current one in the documented order, wrapping from `isyak`
back to `subuh`.

## Masihi date

The Gregorian calendar date for a prayer day, shown alongside the Hijri date.

## Hijri date

The Islamic calendar date for a prayer day, supplied by the MORA source
(`Tarikh`, e.g. `20 Rabiulakhir 1448 H`). The source value is authoritative;
core falls back to the Umm al-Qura calendar when it is missing.

## Duration to next

The clock difference from now to the next entry, wrapping past midnight. Always
non-negative and under 24 hours; formatted for the active locale.

## Data port

The interface core uses to obtain prayer data and persist selection. Backend
agnostic and offline first: the device cache is read first, Supabase refreshes
it. No vendor types may cross it.

## MORA source

The Brunei Ministry of Religious Affairs (KHEU) *Waktu Sembahyang* page, at
`https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx` (the public canonical
host; `mora-prod.cwh.gov.bn` is internal and not reachable from the app). It
lists eight
daily entries — Imsak, Suboh, Syuruk, Doha, Zohor, Asar, Maghrib, Isyak — for
Brunei & Muara; Belait and Tutong are derived by the documented offsets. This is
the authoritative source for prayer times. It is imported into Supabase by a
manual monthly job; shells never read it at runtime. The app credits it as the
data source.

## Prayer time record

One stored prayer time for a date and district: (prayer date, district, prayer)
→ time. This is the unit the data-analysis surface will read.

## Refresh

Fetching fresh prayer data from the backend. Always optional: cached data is the
source of truth for rendering; a failed refresh leaves the last known good data
in place.

## Locale

A UI language. Default is Malay (`ms`); English (`en`) is the fallback. All
user-facing text is a translation key resolved by Nuxt I18n
(`@nuxtjs/i18n`), never a hard-coded string. Prayer names are domain values
(`PrayerName`); their displayed labels are translations owned by the shell.

## Translation key

A dotted identifier (e.g. `prayer.subuh`) in
`apps/web/i18n/locales/<locale>.json`. Every key must exist in the default
locale (`ms`).

