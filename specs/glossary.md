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

The five daily prayers plus the three displayed time boundaries, in order:

1. `imsak` — start of the pre-dawn fast (not a prayer)
2. `subuh` — Fajr / dawn
3. `syuruk` — sunrise (not a prayer, marks the end of Subuh)
4. `doha` — Dhuha / mid-morning (not an obligatory prayer)
5. `zuhur` — Dhuhr / noon
6. `asar` — Asr / afternoon
7. `maghrib` — sunset
8. `isyak` — Isha / night

## Prayer times

The set of times for the eight entries above, for a given date and district.
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
wall-clock time. Before Imsak it is the previous day's Isyak. `imsak`, `syuruk`
and `doha` count as boundaries even though they are not prayers.

## Next entry

The entry after the current one in the documented order, wrapping from `isyak`
back to `imsak`.

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

## Admin

A signed-in Google account whose email is listed in `admin_allowlist`. An admin
may import one Brunei month and correct individual prayer time records through
the `admin` Edge Function; the allowlist is the only authority, checked
server-side on every call. Admins are not a domain role of core — nothing in
core or the shells branches on "admin".

## Refresh

Fetching fresh prayer data from the backend. Always optional: cached data is the
source of truth for rendering; a failed refresh leaves the last known good data
in place.

## Locale

A UI language. Supported: Malay (`ms`, default), Jawi Malay (`ms-Arab`), Arabic
(`ar`), and English (`en`, fallback). Arabic-script locales are right-to-left
and render in the Noto Naskh Arabic webfont. All
user-facing text is a translation key resolved by Nuxt I18n
(`@nuxtjs/i18n`), never a hard-coded string. Prayer names are domain values
(`PrayerName`); their displayed labels are translations owned by the shell.

## Translation key

A dotted identifier (e.g. `prayer.subuh`) in
`apps/web/i18n/locales/<locale>.json`. Every key must exist in the default
locale (`ms`).


## Surah

One of the 114 chapters of the Quran, identified by number (1–114) and by a
name. The Quran Ayat context uses the Malay and English names for Latin-alphabet
search and shows the Arabic name as a label. A surah contains one or more
ayahs.

## Ayah

A numbered verse of a surah, identified by `(surah, ayah)`. There are 6,236
ayahs in the Kufi count used by the Madinah mushaf; the basmalah is numbered
only as `1:1` and is never rendered on its own.

## Juz

One of the 30 canonical divisions of the Quran. Each ayah belongs to exactly
one juz, and the juz are contiguous and non-empty. A juz can span surah
boundaries.

## Ayah range

A selection of ayahs for the Quran Ayat reader: a juz range and a surah range,
each with an inclusive minimum and maximum. A single value is a range whose
ends are equal; the reader draws from the intersection of the two ranges.

## Reveal

One on-demand disclosure of an ayah's identifying information — its juz, its
surah, its ayah number, or the next ayah's text. Reveals are independent and
latch until the ayah changes.
