# Legacy business rules — Waktu Sembahyang Brunei (v3.0.0)

Migration reference for coding agents. Captures the domain rules and data
contracts implemented by the **old** app so they can be reproduced — or
deliberately overridden — in the new one.

> **Status: reference input, not authority.** This file records the legacy
> Firebase app being migrated from. It is a checklist for avoiding missed rules,
> not the spec of the new app. Where the new app differs, the decision is
> recorded in [`parity.md`](./parity.md); the new behavior lives in
> `specs/<context>/spec.md`. Supabase replaces Firebase as the backend.
>
> Rule of thumb: **adopt** domain behavior (prayer model, offsets, time parsing,
> Hijrah rules); **override** legacy implementation accidents (Firebase data
> shape, `910/911/912` key quirk, open rules, unused auth).

## 1. What the app is

A PWA showing daily Islamic prayer times (*waktu sembahyang*) for Brunei, in
Malay. Vue 2 SPA, offline-first, Firebase (Auth + Firestore) backend.
Version 3.0.0. Default branch `main` (published default `master`).

## 2. Prayer-time domain model

Prayers, in fixed order (array index = position):

| # | Name    | Meridiem |
| - | ------- | -------- |
| 0 | Imsak   | am       |
| 1 | Subuh   | am       |
| 2 | Syuruk  | am       |
| 3 | Duha    | am       |
| 4 | Zuhur   | pm       |
| 5 | Asar    | pm       |
| 6 | Maghrib | pm       |
| 7 | Isya    | pm       |

Source of truth: `prayers.prayer_name` in `src/store/module/Prayers.js`.
Names, order, and `state` (**am/pm**) are part of the data contract — the time
parser relies on `state` for PM conversion.

Rules derived from this order:

- `currentPrayerIndex < 4` ⇒ "before Zuhur" (affects which prayers show) —
  `src/views/Home.vue`.
- Post-Isya display: tomorrow's Imsak/Subuh are copied into today's array at
  indices **8 and 9** so the carousel shows the next day's Imsak/Subuh after
  nightfall; the `CountDown.vue` loop deliberately stops at `index > 7`.
- "First half of night" = 18:00–23:59. During it, after Isya (index > 5), the
  Hijrah date is incremented by one.
- `DisplayInfo.isVisible` switches the visible subset at Zuhur: before Zuhur
  show indices `< 8`; after show `> 3`.
- The next-day carousel (dayIndex > 0) hides the current-day-only prayers when
  `currentPrayerIndex < 8`.

### Time parsing (`$prasePrayerTime`, `src/mixins/global.js`)

- Firestore stores times as strings with a **dot** separator and no guaranteed
  leading zero: `"3.50"`, `"12.25"`.
- If the string length < 5, prepend `0` (`"3.50"` → `"03.50"`).
- Hours/minutes read from chars `0-1` and `3-4`.
- If `state` contains `pm` and hour < 12, add 12. `12.xx pm` stays 12.
- Result is a `Date` anchored to the given day at hh:mm:00.

### Display format

12-hour with `state` suffix, e.g. `12:25 pm`, `03:47 pm`; hour/minutes
zero-padded, hour not forced below 12.

## 3. District / region rules

- Three options, default `brunei`, persisted in `localStorage.selectedDistrict`,
  broadcast via `eventBus` event `districtClicked`.
- **Minute offsets added to every prayer time:** `brunei: 0`, `tutong: +1`,
  `belait: +3`.
- "Brunei Muara & Temburong" is a single combined region (`value: "brunei"`).
- District change rebuilds all three days of data.

## 4. Data lifecycle — offline-first, version-gated

Chain in `prayers/getPrayerData` (`src/store/module/Prayers.js`):

1. If `localStorage.prayer_data` exists → load from localStorage (fast, offline).
2. Else fetch from Firestore and write both `prayer_data` and
   `local_storage_metadata` to localStorage.
3. Always compare local metadata `version` vs Firestore metadata `version`; if
   Firestore is **greater**, refetch from Firestore (refresh path).

`hasData` gates the UI loader; `Home.vue` watches `hasData` and (re)builds the
day carousel.

### Firestore shape (business contract)

- Collection `waktu`, document id = month: `"1"`…`"9"`, `"910"`, `"911"`,
  `"912"` for Oct/Nov/Dec (see below).
- Document body: `{ Day: [ {Date, Tarikh, Imsak, Subuh, Syuruk, Duha, Zuhur,
  Asar, Maghrib, Isya}, ... ] }` — array of daily objects.
- Metadata: collection `metadata`, doc `data`, body `{ data: { version: <n> } }`.
- `Date` format `"d/M/yyyy"`; `Tarikh` is the Hijrah string, e.g.
  `"17 Jamadilawal 1442"`.

**Why Oct–Dec ids are `910/911/912`:** `Months.js` stores `value: 910, 911, 912`
for October/November/December. Seed and Admin reuse that value as the doc key
(`m = "9" + m` when `m > 9`). Preserve this quirk or migrate the key scheme
deliberately.

## 5. Admin data-entry rules

- Admin splits pasted text by newline then tab. Expects **exactly 10
  tab-separated columns in this order**: `Date, Tarikh, Imsak, Subuh, Syuruk,
  Duha, Zuhur, Asar, Maghrib, Isya`.
- `:` in every cell is replaced with `.` (normalizes pasted times).
- Each upload writes the month doc and **increments metadata version** so
  clients refresh.
- `+/-` buttons adjust the Hijrah day number in `Tarikh`.
- "Convert" requires a month selected and non-empty text.

## 6. Notifications

- Push via `push.js` (browser Notification API). Permission requested on mount.
- When a prayer time *starts* → push `"Sudah masuk waktu X"` / body
  `"Selamat menunaikan solat X"` and a snackbar.
- When within `activeStart` (default **15 min**) of the next prayer → push
  `"<time> lagi kn masuk waktu X"` / body `"Sedia tah..."`.
- All gated on `Push.Permission.has()` and `"Notification" in window`.
- Snackbar driven by root Vuex `notify` mutation / `$notify`.

## 7. Debug mode (keep for parity)

Query params on `/` persisted to `localStorage.debug_data`:

| Param | Meaning                              |
| ----- | ------------------------------------ |
| `d`   | isDebugging                          |
| `dt`  | customDateTime                       |
| `s`   | tick speed in ms (default 1000)      |
| `i`   | interval unit (default `minutes`)    |

- Custom/advanced clock replaces real time; debug panel shows +/- controls.
- Without debug, `TodayDate` refreshes every **500 ms**.
- Midnight rollover triggers a data rebuild when the day-of-month changes.

## 8. Locales & calendar

- Day names (Sun→Sat): `Ahad, Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu`.
- UI/date-fns locale is **Malay (`ms`)**; countdown text uses it.
- Gregorian month display names are English (`January`…); computer keys
  lowercase (`january`…).
- Hijrah day gets zero-padded only when the next day < 10.

## 9. Environment / build rules

- **Node 14 mandatory** (`node-sass@4`); devcontainer only, never host installs.
- Vue 2.6 / Vuex 3 / Vue Router 3 / Vuetify 2 / Vue CLI 4 / Firebase 9 modular.
  (Legacy stack; the new app is Nuxt + the Supabase adapter.)
- Dev server port `8080`; PWA manifest name `Waktu Sembahyang Brunei`, short
  `WSB`, theme `#455A64`, portrait standalone.
- Router uses `history` mode; Netlify SPA fallback `/* → /index.html` and
  Firebase Hosting both configured. (New app: Nuxt/Nitro deploy target, TBD.)
- Google Analytics (`vue-gtag`) only in production, id `C2E9CKWZCC`.
- Firebase web config is **not secret**; keep service accounts out of the repo.
  (New app: Supabase anon key is public; service-role key must never ship.)
- Legacy dev boot connects Firestore + Auth emulators, **clears localStorage,
  flushes Firestore, then seeds** dummy data and admin user `admin@wsb.com` /
  `!Password1`. Emulator ports: auth `9099`, firestore `8089`, UI `4000`.
  (New app: use the **Supabase local stack** via `supabase start` + seed SQL.)

## 10. Known gaps / cautions for migration

- **Firestore rules are wide open** (`allow read, write` for all) in
  `firestore.rules`. Insecure — replace, do not copy. (New app: write Supabase
  RLS policies; public read on prayer tables, admin-only writes behind Auth.)
- **Auth is wired but unused by routing:** no navigation guard on `/admin`; the
  Admin page is publicly reachable. Add route protection and real rules if auth
  is a requirement.
- `getCurrentUser` has a bug: `getAuthInstance()()` double call
  (`src/infrastructure/firebase/auth.js`).
- `Months.js` `value: 910/911/912` is confusing; it feeds the collection key
  scheme — legacy compatibility, not a model to copy.
- `checkNewData` returns `undefined` on error, treated as false.
- Seed data is hardcoded 32 identical fake days — dev-only.
- Tests run against emulators only; unit Firebase tests self-seed/clear; e2e
  uses `tests/e2e/fixtures/prayer_data.json` with `debug_data` customDateTime.

## 11. Minimum behavior a migrated app must reproduce

1. Load today + tomorrow + day-after from monthly data; parse `d.m` times with
   am/pm logic.
2. Apply district minute offsets; default Brunei Muara & Temburong.
3. Show countdown to next prayer in Malay, highlight within 15 min, show
   current prayer / "Sudah masuk waktu".
4. Post-Isya: show tomorrow's Imsak/Subuh, increment Hijrah date in
   18:00–23:59.
5. Offline-first localStorage cache with metadata version-based refresh.
6. Browser push notifications on prayer entry and 15-min pre-alert.
7. Admin import of tab-separated month data with version bump.

Verification for any migration: `npm run lint`, `npm run test:unit` (with
emulators running), `npm run build`.
