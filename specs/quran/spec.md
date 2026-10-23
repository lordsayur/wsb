# Quran Ayat — spec

- **Status:** active
- **Context:** core domain (new)
- **Code:** `packages/core` (logic), `packages/data` (corpus), `apps/web` (view)
- **Depends on:** nothing (corpus is static and bundled)

## Purpose

Read one Quran ayah at a time, in Arabic, drawn uniformly at random from a
scope the reader chooses: the whole Quran, one juz, or one surah. The reader
then reveals the ayah's juz, surah and number — or reveals the following ayah —
one step at a time. Nothing about the ayah is disclosed until the reader asks.

## Ubiquitous language

Terms from [`../glossary.md`](../glossary.md): **Ayah**, **Surah**, **Juz**,
**Scope**, **Reveal**.

## Behavior

### Setup state

- `/ayat` opens in the **setup state**: only the range selection is shown.
  No ayah is loaded, fetched or picked.
- The reader chooses **one** scope: the whole Quran, a **juz range** (1–30),
  or a single **surah** (1–114). Juz and surah are alternatives, never
  combined; choosing one clears the other.
- The juz range is picked from two drop-downs of the 30 juz.
- A Latin-alphabet fuzzy search field finds a surah by its Malay or English
  name (weighted equally) and selects it. Each result shows the surah's Arabic
  name alongside the localized name. Arabic input is not matched.
- **Start** applies the scope and enters the reading state. Every scope
  contains ayahs, so Start is always enabled once the scope is chosen.
- A juz scope uses two drop-downs, **from** and **to**, either order accepted;
  equal ends mean one juz. Switching scope mode keeps the last juz range or
  surah chosen instead of resetting it.
- The selection defaults to the whole Quran; changing it does not re-roll until
  Start is pressed.

### Reading state

- Shows exactly one ayah. Its Arabic text is **hidden until revealed**: no
  surah, juz or ayah number is shown either, and the text is not in the DOM
  (hidden with `v-if`, never merely styled invisible).
- While the text is hidden, the ayah is represented by a skeleton placeholder,
  so the reader sees that an ayah exists without seeing it.
- The revealed surah name is always shown in Arabic, with the localized name
  beside it when the locale is not Arabic-script.
- The basmalah is never rendered: it is not a numbered ayah and would reveal
  that the ayah opens a surah.
- Each ayah row has a small circular **play** control and a **reveal text**
  control. Playing the recitation does not reveal the text; revealing the text
  does not play the recitation. The reader may do either first, or both.
- Controls are separate and independent: **Reveal juz**, **Reveal surah**,
  **Reveal ayah number**, **Next ayah**, **New ayah**, **Change filter**.
- A reveal is a latch: once used, that hint stays visible and its button is
  disabled until **New ayah** or a filter change. Revealed text stays visible
  for that ayah.
- The ayah area is a bounded, scrollable pane of fixed height: a long ayah or
  passage scrolls inside it, so the reveal chips and actions below never move.
  Appending an ayah scrolls the pane to the newest row. Consecutive ayahs are
  separated by a hairline rule.
- **Next ayah** appends the next ayah of the scope, repeatable, building the
  passage gradually. The appended ayah starts hidden with its own play control.
  In a juz scope it continues into the following surah past a surah's last
  ayah; in a surah scope it stops at that surah's last ayah.
- **New ayah** picks again inside the active range, resets every reveal and
  stops playback.
- **Change filter** opens the setup state pre-filled with the active selection.
  **Start** applies it, re-rolls immediately and returns to the reading state
  (option a), resetting every reveal and stopping playback.

### Recitation

- Every ayah has one recitation: a per-ayah audio file fetched on demand from
  the EveryAyah CDN (Hudhaify, 128 kbps). Audio is never bundled with the app
  and never fetched by juz.
- The file for `(surah, ayah)` is `SSSAAA.mp3`, e.g. `2:255` →
  `https://everyayah.com/data/Hudhaify_128kbps/002255.mp3`.
- One recitation plays at a time. Pressing an ayah's play control fetches and
  plays that ayah; pressing it again stops it, and pressing it after the file
  ends plays it again.
- Starting another ayah's recitation stops the previous one. **New ayah** and a
  filter change also stop playback.
- A loading, playing and failed state are shown on the control. Failure is
  inline and retryable; it never blocks revealing the text.

### Picking

- Each ayah in the active scope has equal probability; surah length does not
  weight the pick.
- An ayah outside the active scope is never shown; a filter change always
  yields a new ayah inside the new scope.
- A surah scope never crosses into another surah, not even for **Next ayah**.
- The pick is unlimited and random: there is no daily seed, streak or score.

### Source and presentation

- The corpus is the Tanzil.net Uthmani text (Hafs, Kufi count): 114 surahs,
  30 contiguous juz, 6,236 ayahs, basmalah numbered only as `1:1`.
- The corpus ships with the app and is loaded lazily by juz, so the main page
  bundle does not grow and the reader works offline once cached.
- Arabic text is right-to-left and rendered in a self-hosted Uthmani-capable
  font; it is never translated.
- The Tanzil attribution and licence notice are visible on the page.
- While a juz chunk loads, show a skeleton; on failure show an unavailable
  state, never a blank crash.
- All interface text is a translation key, Malay first.

## Invariants

- The corpus covers every ayah exactly once, maps each ayah to exactly one
  juz, and every juz is contiguous and non-empty.
- `next` never leaves the active range and never returns a basmalah.
- A revealed value never changes while the same ayah is shown.
- Juz and surah scopes are mutually exclusive; exactly one may be active.
- No identifying information is rendered without its reveal.
- No ayah text is in the DOM before its own reveal.
- At most one ayah recitation plays at a time.

## Acceptance criteria

- [x] Setup shows no ayah before Start; Start is disabled on an empty
      intersection.
- [x] Picking over the whole corpus is uniform per ayah.
- [x] A juz scope and a surah scope each draw only from their own ayahs and
      never combine.
- [x] Every ayah maps to one juz; juz boundaries match the corpus index.
- [x] Each reveal button is independent and latches until the ayah changes.
- [x] `2:286 → 3:1` is the next ayah; the passage stops at the range end.
- [x] A filter change re-rolls inside the new range and clears all reveals.
- [x] Search finds `baqarah`, `kahf`, `ikhlas` and a one-edit typo, ranking
      Malay and English names equally, and lists the Arabic name.
- [x] The corpus integrity check passes: 114 surahs, 30 juz, 6,236 ayahs.
- [x] `/ayat` does not pull the corpus into the main page bundle.
- [x] Starting shows a skeleton per ayah, not Arabic text; text appears only
      after **Reveal text**.
- [x] A newly appended ayah starts hidden with its own play control.
- [x] Pressing play fetches and plays the ayah audio with the text still
      hidden.
- [x] Pressing the same play control again stops it; after the file ends the
      control plays it again.
- [x] Starting another ayah's recitation stops the first; new ayah and a filter
      change stop playback.
- [x] Audio failure shows an inline retry and still allows revealing the text.
- [x] `1:1` and `114:6` map to the first and last recitation files; an invalid
      reference maps to none.

## Interfaces

```
Ref      { surah, ayah }                      1-based
AyahRef  Ref & { juz, index }                 index 0..6235
Scope    { kind: 'all' } | { kind: 'juz', juzMin, juzMax } | { kind: 'surah', surah }
Reveal   { juz, surah, ayah, next }           booleans + next count

scopeRange(scope): AyahRange                  internal intersection form
pickAyah(index, range, rng): AyahRef | null
nextAyah(index, ref, range): AyahRef | null
searchSurah(query, index): SurahInfo[]
reveal(state, kind): Reveal
revealTextAt(shown, index): readonly boolean[]   latch one reveal
ayahAudioUrl(index, ref, base?): string | null   EveryAyah file for a ref
```

The types live in core and are dataset-injected; core performs no I/O.

## Out of scope

- Translations, tafsir, memorisation, scoring and streaks.
- Reciter selection and offline audio caching: one fixed reciter, streamed.
- Non-web shells (the corpus packaging may be revisited for them later).
- Free-text entry of the ayah, surah or juz; reveals are button-driven.

## Changelog

- 2026-10-22 — initial spec: setup/reading states, per-ayah uniform pick,
  independent reveals, incremental next ayah.

- 2026-10-23 — one scope per session (juz or surah, never both); juz range from
  two drop-downs, single surah from search; Arabic surah name always shown;
  fixed-height scrollable ayah pane with rules between ayahs.

- 2026-10-23 — ayah text hidden behind a skeleton until **Reveal text**; each
  ayah row carries a circular play control; per-ayah Hudhaify recitation from
  EveryAyah, one at a time, never bundled; audio failure is inline.
