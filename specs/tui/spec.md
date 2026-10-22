# TUI shell — spec

- **Status:** active
- **Context:** presentation (shell)
- **Code:** `apps/tui`
- **Depends on:** Prayer Times (core), Data (port)

## Purpose

A terminal shell over core: the day's prayer times in a full-screen terminal
interface, plus a plain one-shot mode when output is piped. Rendering and
platform glue only; no domain rules.

## Behavior

### Interface

- A full-screen interface fills the whole terminal: every frame is exactly the
  reported column and row count, and a resize repaints at the new size. There
  is no fixed-width box floating in a larger window.
- Three views share one frame: **day**, **month** and **trend**, selected with
  `1`/`2`/`3` or `Tab`. The active tab is shown in the tab strip.
- **Day** shows the eight entries in order (Imsak, Subuh, Syuruk, Dhuha, Zuhur,
  Asar, Maghrib, Isyak) with their formatted times for the selected district. A
  header carries the weekday, the Masihi date, the Hijri date and the duration
  until the next entry. The current entry is highlighted; the next entry is
  marked.
- **Month** is a scrollable table of the selected month: one row per day, one
  column per entry, today's row and current cell highlighted. `j`/`k` and the
  arrow keys scroll, `[`/`]` (or `p`/`n`) move a month back and forward. When
  the terminal is too narrow for all eight columns, the five fard entries are
  kept and Imsak/Syuruk/Dhuha go first; the title reports how many are hidden
  (`+3 hidden`). Columns always stay in calendar order.
- **Trend** mirrors the web chart: the eight entries drawn as overlapping
  coloured **line** segments (`─`, `│`, `╱`, `╲`, crossing at `┼`/`╳`) on one
  shared minute-of-day axis, over a **week**, **month** or **year**. Filled
  cells are never used, so the plot cannot read as a bar chart. The y axis is labelled at the same rounded ticks the web chart uses
  and the x axis places its date labels under the columns they belong to. A
  legend names the colours. `w`/`m`/`y` switch the range, `[`/`]` (or `p`/`n`)
  move by one period, `t` returns to the current period. A missing day leaves a
  gap in the line rather than a false point.
- The frame redraws once a second so the duration and the current highlight
  track the clock without user input.
- The content block is centred horizontally and vertically inside the frame, so
  a wide or tall terminal gets a centred view instead of a top-left corner.
- Colour: the current entry, each prayer's time and each trend line use the same
  per-prayer palette as the web chart, in 24-bit ANSI. The active tab, today's
  row and the countdown use the accent colour. Colour is used only when stdout
  is a terminal.
- Keys: `q`/`Esc` quits, `d` cycles the district, `l` cycles the language,
  `f` toggles the 12/24-hour clock, `r` refetches, `?` toggles the key help.
- The frame advertises the keys and credits the MORA/KHEU source.
- The district, language and clock choices persist between runs.

### Piped output

- When stdout is not a terminal, the shell prints the day as plain text once
  and exits: header, then one line per entry (`HH:MM  Label`), then the source
  credit. It accepts `--date YYYY-MM-DD` and `--json` (a single JSON object with
  date, district, hijri date, entries and current/next).
- `wsb --month [YYYY-MM]` prints the month table as plain text (no escapes) and
  exits; without an argument it prints the current month.
- `wsb now` prints one line and exits, in a terminal or not: the current entry
  with its time, then the countdown to the next (e.g. `Asar 15:20 · Maghrib in
  2h 50m`). Before the first entry of the day there is no current entry, so the
  line is just the countdown (`Imsak in 4h 41m`). `wsb now --json` uses the
  `--json` payload.
- Piped mode never reads stdin, never enters the alternate screen and never
  draws escape sequences.

### Data

- Times come from Supabase through the Data port. The device cache is a file
  under `$XDG_STATE_HOME/wsb` (or `~/.local/state/wsb`); it is served first and
  a failed refresh falls back to the last known day.
- MORA is never contacted at runtime.
- With no Supabase configuration the interface shows the unavailable state;
  there is no fake fallback. `wsb --help` and `--version` still work, and
  `wsb doctor` reports whether a Supabase configuration is present.

### Packaging and install

- The shell publishes to npm as `wsb-tui`: `npx wsb-tui` runs it with no
  install, `npm i -g wsb-tui` installs it. The published package bundles core
  and data (they are private workspace packages).
- A standalone binary is built for `linux-x64`, `linux-arm64`, `darwin-arm64`
  and `windows-x64`. Each is attached to the same GitHub release as the
  extension artifacts, under stable names (`wsb-tui-<os>-<arch>[.exe]`) with a
  `.sha256` beside it.
- `scripts/install.sh` downloads the binary matching `uname` into
  `${WSB_BIN_DIR:-$HOME/.local/bin}`, verifies its checksum, and fails closed on
  a mismatch. `WSB_VERSION` pins a release instead of `latest`. After
  installing it prints the available commands (`wsb`, `wsb now`, `wsb --json`,
  `wsb --date`, `wsb doctor`, `wsb update`), the keys, and a PATH hint when the
  install directory is not on `PATH`.
- The `/download` page lists the TUI as available with the `curl … | sh`
  command, the `npx wsb-tui` alternative and a screenshot of the real
  interfaces. `apps/tui/scripts/screenshot.mjs` regenerates that image from the
  actual renderer (`apps/web/public/tui-screenshot.png`).

### Update

- `wsb update` reads the baked-in version and asks the GitHub releases API for
  the latest tag, then prints one of: already current, a newer version with the
  `curl … | sh` command, or that the check failed (still showing the command).
  It always exits 0 unless the check cannot run at all.
- Checking never executes remote code. `wsb update --apply` reruns the documented
  `curl … | sh` installer only when a newer release exists, inheriting its
  output and exit code. A failed or offline check never applies anything.
- `wsb update` works without Supabase configuration.

## Invariants

- No domain rule in the shell; core owns offsets, progress, formatting and the
  reminder schedule.
- Every runtime user-facing string is a translation key from the same
  catalogues as the web shell.
- The shell ships only the public Supabase URL + anon key (read-only RLS); no
  service-role key. It never contacts MORA at runtime.
- The bundle contains no remote code and no analytics.
- No terminal UI framework dependency: the renderer is ANSI on `tty`, and the
  palette is shared with the web chart's per-prayer colours.

## Acceptance criteria

- [ ] The interface renders the eight entries in order for the selected
      district.
- [ ] Every frame fills the terminal exactly, at any size, and a resize repaints.
- [ ] The day, month and trend views switch with `1`/`2`/`3` and `Tab`.
- [ ] The month table scrolls and moves by month.
- [ ] On a narrow terminal the month keeps the fard columns, drops optional ones
      in calendar order, and reports the hidden count.
- [ ] The trend draws all eight entries on one shared axis, like the web chart.
- [ ] Trend ranges week/month/year via `w`/`m`/`y`, periods step with `[`/`]`,
      and `t` returns to the current period.
- [ ] Content is centred in both axes at any terminal size.
- [ ] The current entry, times and trend rows are coloured on a terminal and
      plain when piped.
- [ ] Selecting Tutong/Belait shifts the entries by +1/+3 minutes.
- [ ] The current entry is highlighted and the duration to next is shown.
- [ ] District, language and time format survive a restart.
- [ ] `q` and `Esc` exit and restore the terminal state.
- [ ] Piped stdout prints plain lines and no escape sequences.
- [ ] `wsb --month` prints the month table without escapes.
- [ ] A frame never clips text mid-escape-sequence at any width.
- [ ] `--json` prints one JSON object with the day and progress.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] With no Supabase configuration the interface shows the unavailable state.
- [ ] The build produces an npm tarball and a standalone binary.
- [ ] The installer prints the available commands once it finishes.
- [ ] `wsb now` prints the current entry and the countdown to the next, or just
      the countdown when the day has not started.
- [ ] `wsb update` reports current, available or unknown, and only `--apply`
      reruns the installer.

## Out of scope

- Business logic — core.
- Backend/network adapters — Data.
- Notifications and background scheduling — extension/VS Code shells.
- Homebrew, AUR and OS package repositories — the npm package and the static
  binary cover Linux, macOS and Windows.

## Changelog

- 2026-10-22 — initial: full-screen interface, piped mode, npm package,
  standalone binaries and the curl installer.
- 2026-10-22 — the installer ends with the run commands, keys and a PATH hint.
- 2026-10-22 — add `wsb now`: one line with the current entry and the
  countdown to the next, usable in terminals and pipes. The installer now
  prints every command.
- 2026-10-22 — add `wsb update`: check the latest GitHub release and print the
  install command; `--apply` reruns the installer.
- 2026-10-22 — fill the whole terminal, add 24-bit colour, and add the month
  and trend views with their keys, the `--month` plain report and a
  downloads-page screenshot generated from the renderer.
- 2026-10-22 — keep the fard columns (and rows) first when space runs out and
  report how many are hidden; drop whole footer parts instead of clipping.
- 2026-10-22 — make the trend a real overlapped line chart on a shared axis
  with week/month/year ranges, centre the content, and align x labels.
- 2026-10-22 — draw the trend with line glyphs instead of braille dots, which
  read as filled bars.
