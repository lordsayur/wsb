# Legacy parity checklist

Rule-by-rule disposition of [`business-rules.md`](./business-rules.md) for the
new app. Use this as the migration checklist: every legacy rule is **adopt**,
**override**, or **drop**, with a reason. When the new app implements an adopted
rule it lands in the owning context spec — this table is the bridge, not the
final spec.

Legend: **A** = adopt (same behavior), **O** = override (deliberate change),
**D** = drop (not a requirement).

## 2. Prayer-time domain model

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 2.1 | Eight entries in fixed order: Imsak, Subuh, Syuruk, Duha, Zuhur, Asar, Maghrib, Isya | **A** | core; expands the current 6-entry glossary — see OPEN-1 |
| 2.2 | `state` (am/pm) is part of the data contract; parser uses it | **O** | Store 24h `HH:mm` in Supabase; derive am/pm at render. Removes a whole class of parse bugs |
| 2.3 | Times stored as `"3.50"` (dot, no leading zero) | **O** | Supabase column type `time` (or `HH:mm` text); adapters normalize legacy input |
| 2.4 | `currentPrayerIndex < 4` ⇒ "before Zuhur" | **A** | core display window |
| 2.5 | Post-Isya: copy tomorrow's Imsak/Subuh into today at indices 8,9 | **O** | Model next-day entries explicitly, not by mutating the array to index 8/9 |
| 2.6 | Countdown loop stops at `index > 7` | **D** | Implementation detail of the copy trick (2.5) |
| 2.7 | "First half of night" = 18:00–23:59; after Isya increment Hijrah date | **A** | core date rule; confirm boundary inclusive — OPEN-2 |
| 2.8 | `DisplayInfo.isVisible`: before Zuhur indices `< 8`, after `> 3` | **A** | core display window |
| 2.9 | Next-day carousel hides current-day-only prayers when index < 8 | **A** | core/carousel rule |
| 2.10 | 12-hour display with am/pm suffix, zero-padded | **A** | shell formatting via locale-aware formatter (not string slicing) |
| 2.11 | `12.xx pm` stays 12; PM hour < 12 adds 12 | **A** | covered by real time types after 2.2/2.3 override |

## 3. District / region rules

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 3.1 | Three options, default `brunei` | **A** | core; three-district model, Temburong folded into Brunei & Muara |
| 3.2 | "Brunei Muara & Temburong" is one combined region | **A** | core; `brunei` is the canonical value |
| 3.3 | Offsets: brunei 0, tutong +1, belait +3 | **A** | core (matches current spec) |
| 3.4 | Persist `selectedDistrict` in localStorage | **O** | Persist through the Data port (adapter may use localStorage) so shells stay port-only |
| 3.5 | District change rebuilds all three days | **A** | core state derivation |
| 3.6 | Broadcast via `eventBus` `districtClicked` | **O** | Replace with core state/store subscription; no global event bus |

## 4. Data lifecycle

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 4.1 | Read cache first, then remote; version-gated refresh | **A** | data spec (cache = source of truth, refresh optional) |
| 4.2 | Cache key `prayer_data` + `local_storage_metadata` | **O** | Opaque to the port; adapter owns cache keys and schema |
| 4.3 | Firestore collection `waktu`, doc id = month | **O** | Supabase tables keyed by year+month (real month number) |
| 4.4 | Oct–Dec doc ids `910/911/912` | **D** | Legacy `Months.js` quirk; do not reproduce |
| 4.5 | Body `{ Day: [...] }`, one doc per month | **O** | Normalized rows: one row per date, or a month JSON column — decide in data spec |
| 4.6 | Metadata doc `{ data: { version } }` per month/global | **A** | Keep a version/updated_at used for refresh gating |
| 4.7 | `Date` = `"d/M/yyyy"`, `Tarikh` = Hijrah string | **O** | Store ISO date + structured Hijrah (day, month, year); format at render |
| 4.8 | `hasData` gates loader | **A** | shell loads from explicit data state |

## 5. Admin data-entry

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 5.1 | Paste tab-separated, exactly 10 columns in fixed order | **A** | admin import contract (Date, Tarikh, Imsak, Subuh, Syuruk, Duha, Zuhur, Asar, Maghrib, Isya) |
| 5.2 | Replace `:` with `.` in cells | **D** | Normalize to real times at import instead |
| 5.3 | Upload writes month doc and bumps metadata version | **A** | replace doc write with table upsert + version bump |
| 5.4 | `+/-` adjusts Hijrah day in `Tarikh` | **A** | admin UI while structured Hijrah is stored (4.7) |
| 5.5 | Convert requires month + non-empty text | **A** | admin validation |
| 5.6 | Admin page had no auth guard | **O** | Require Auth + RLS for writes; no public admin |

## 6. Notifications

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 6.1 | Browser Notification API, permission on mount | **A** | new notification context (shell) |
| 6.2 | On prayer start: "Sudah masuk waktu X" / "Selamat menunaikan solat X" | **A** | i18n keys, not literals |
| 6.3 | Pre-alert within 15 min (`activeStart`): "<time> lagi kn masuk waktu X" | **A** | configurable constant; default 15 |
| 6.4 | Gated on Notification availability/permission | **A** | shell |
| 6.5 | Snackbar via root Vuex `notify` | **O** | shell-local toast; no global store requirement |

## 7. Debug mode

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 7.1 | Query params `d`, `dt`, `s`, `i` persisted to `debug_data` | **A** | keep as a dev-only clock override for deterministic tests/demo |
| 7.2 | Debug clock replaces real time; +/- controls | **A** | test seam for time |
| 7.3 | `TodayDate` refreshes every 500 ms | **O** | drive from a 1 s tick / same minute boundary; avoid needless renders |
| 7.4 | Midnight rollover rebuilds data on day-of-month change | **A** | core day derivation |

## 8. Locales & calendar

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 8.1 | Day names Ahad…Sabtu | **A** | i18n `ms` |
| 8.2 | UI locale Malay; countdown in Malay | **A** | i18n default `ms` (already required) |
| 8.3 | Gregorian month names English; keys lowercase | **A** | i18n keys; display via `$d` |
| 8.4 | Hijrah day zero-padded only when next day < 10 | **D** | legacy display hack; format consistently |

## 9. Environment / build

| # | Legacy rule | Disposition | New home / note |
| --- | --- | --- | --- |
| 9.1 | Node 14 mandatory (`node-sass`) | **D** | new stack: Nuxt 4, current Node LTS |
| 9.2 | Vue 2 / Vuex / Vuetify / Vue CLI | **D** | Nuxt 4 + core |
| 9.3 | PWA manifest name/short/theme `#455A64`, portrait standalone | **A** | web shell manifest |
| 9.4 | Router history mode; Netlify fallback | **A** | Nuxt history + host fallback |
| 9.5 | GA only in production, id `C2E9CKWZCC` | **A** | confirm id still valid — OPEN-4 |
| 9.6 | Firebase config public; service accounts out of repo | **O** | Supabase anon key public; service-role key never ships |
| 9.7 | Dev boot seeds/reset data + admin user, emulator ports | **O** | Supabase local stack (`supabase start`) + seed SQL; no emulator port contract |

## 10. Known gaps (do not copy)

| # | Legacy issue | Disposition | New home / note |
| --- | --- | --- | --- |
| 10.1 | Wide-open Firestore rules | **O** | Supabase RLS: public read, admin-only write |
| 10.2 | No `/admin` route guard | **O** | protect admin |
| 10.3 | `getCurrentUser` double-call bug | **D** | not applicable |
| 10.4 | `910/911/912` month keys | **D** | see 4.4 |
| 10.5 | `checkNewData` returns undefined on error | **D** | explicit error states in data spec |
| 10.6 | Fake 32-day seed | **D** | dev seed only, clearly labelled |
| 10.7 | Emulator-bound tests | **O** | Supabase local stack in CI |

## 11. Minimum behavior to reproduce

Adopt all seven, mapped: 11.1→core time model, 11.2→core offsets,
11.3→core+shell countdown, 11.4→core next-day/Hijrah, 11.5→data port,
11.6→notification context, 11.7→admin + data port.

## Open decisions

- **OPEN-1** — **Resolved 2026-10-20:** core exposes all eight entries, Imsak
  first, with `doha` between `syuruk` and `zuhur`. Imsak is displayed but, like
  Syuruk and Dhuha, gets no reminder.
- **OPEN-2** — "First half of night" boundary: is 23:59 inclusive, and what
  happens at exactly 00:00/isya+? Recommendation: use `[18:00, 00:00)`.
- **OPEN-3** — **Resolved 2026-10-18:** adopt the legacy three-value model;
  Temburong is folded into Brunei & Muara and the old value resolves as an
  alias.
- **OPEN-4** — Analytics: keep Google Analytics, or drop it (privacy/size)?
- **OPEN-5** — Naming: legacy uses "Isya"; current glossary uses "isyak".
  Pick one canonical domain identifier.

## Changelog

- 2026-10-18 — created from `business-rules.md` (legacy v3.0.0); Supabase
  replaces Firebase.
