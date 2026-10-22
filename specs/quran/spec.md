# Quran Ayat — spec

- **Status:** active
- **Context:** core domain (new)
- **Code:** `packages/core` (logic), `packages/data` (corpus), `apps/web` (view)
- **Depends on:** nothing (corpus is static and bundled)

## Purpose

Read one Quran ayah at a time, in Arabic, drawn uniformly at random from a
range the reader chooses. The reader can narrow the range by juz and by surah,
then reveal the ayah's juz, surah and number — or reveal the following ayah —
one step at a time. Nothing about the ayah is disclosed until the reader asks.

## Ubiquitous language

Terms from [`../glossary.md`](../glossary.md): **Ayah**, **Surah**, **Juz**,
**Ayah range**, **Reveal**.

## Behavior

### Setup state

- `/ayat` opens in the **setup state**: only the range selection is shown.
  No ayah is loaded, fetched or picked.
- The selection is a **juz range** (1–30) and a **surah range** (1–114); a
  single value is a range whose ends are equal. The two ranges intersect.
- A Latin-alphabet fuzzy search field finds a surah by its Malay or English
  name (weighted equally) and sets the surah range. The Arabic name is shown
  as a label and is not matched by Latin input.
- **Start** applies the selection and enters the reading state. It is disabled,
  with an inline reason, when the intersection contains no ayah.
- The selection defaults to the whole Quran; changing it does not re-roll until
  Start is pressed.

### Reading state

- Shows exactly one ayah in Arabic. No surah, juz or ayah number is shown.
- The basmalah is never rendered: it is not a numbered ayah and would reveal
  that the ayah opens a surah.
- Controls are separate and independent: **Reveal juz**, **Reveal surah**,
  **Reveal ayah number**, **Next ayah**, **New ayah**, **Change filter**.
- A reveal is a latch: once used, that hint stays visible and its button is
  disabled until **New ayah** or a filter change.
- **Next ayah** appends the next ayah of the range, repeatable, building the
  passage gradually. It continues into the following surah past a surah's last
  ayah and stops at the last ayah of the range.
- **New ayah** picks again inside the active range and resets every reveal.
- **Change filter** opens the setup state pre-filled with the active selection.
  **Start** applies it, re-rolls immediately and returns to the reading state
  (option a), resetting every reveal.

### Picking

- Each ayah in the range intersection has equal probability; surah length does
  not weight the pick.
- An ayah outside the active range is never shown; a filter change always
  yields a new ayah inside the new range.
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
- No identifying information is rendered without its reveal.

## Acceptance criteria

- [x] Setup shows no ayah before Start; Start is disabled on an empty
      intersection.
- [x] Picking over the whole corpus is uniform per ayah.
- [x] Juz and surah ranges intersect exactly, including single-value ranges.
- [x] Every ayah maps to one juz; juz boundaries match the corpus index.
- [x] Each reveal button is independent and latches until the ayah changes.
- [x] `2:286 → 3:1` is the next ayah; the passage stops at the range end.
- [x] A filter change re-rolls inside the new range and clears all reveals.
- [x] Search finds `baqarah`, `kahf`, `ikhlas` and a one-edit typo, ranking
      Malay and English names equally.
- [x] The corpus integrity check passes: 114 surahs, 30 juz, 6,236 ayahs.
- [x] `/ayat` does not pull the corpus into the main page bundle.

## Interfaces

```
Ref      { surah, ayah }                      1-based
AyahRef  Ref & { juz, index }                 index 0..6235
Range    { juzMin, juzMax, surahMin, surahMax }
Reveal   { juz, surah, ayah, next }           booleans + next count

pickAyah(index, range, rng): AyahRef | null
nextAyah(index, ref, range): AyahRef | null
searchSurah(query, index): SurahInfo[]
reveal(state, kind): Reveal
```

The types live in core and are dataset-injected; core performs no I/O.

## Out of scope

- Translations, tafsir, recitation audio, memorisation, scoring and streaks.
- Non-web shells (the corpus packaging may be revisited for them later).
- Free-text entry of the ayah, surah or juz; reveals are button-driven.

## Changelog

- 2026-10-22 — initial spec: setup/reading states, per-ayah uniform pick,
  independent reveals, incremental next ayah.
