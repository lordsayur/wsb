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

- A full-screen interface shows the eight entries in order (Imsak, Subuh,
  Syuruk, Dhuha, Zuhur, Asar, Maghrib, Isyak) with their formatted times for the
  selected district.
- A header carries the weekday, the Masihi date, the Hijri date and the
  duration until the next entry.
- The current entry is highlighted; the next entry is marked.
- The frame redraws once a second so the duration and the current highlight
  track the clock without user input.
- Keys: `q`/`Esc` quits, `d` cycles the district, `l` cycles the language,
  `f` toggles the 12/24-hour clock, `r` refetches the current day, `?` toggles
  the key help.
- The frame advertises the keys and credits the MORA/KHEU source.
- The district, language and clock choices persist between runs.

### Piped output

- When stdout is not a terminal, the shell prints the day as plain text once
  and exits: header, then one line per entry (`HH:MM  Label`), then the source
  credit. It accepts `--date YYYY-MM-DD` and `--json` (a single JSON object with
  date, district, hijri date, entries and current/next).
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
  installing it prints how to run the shell (`wsb`, `wsb doctor`), the keys, and
  a PATH hint when the install directory is not on `PATH`.
- The `/download` page lists the TUI as available with the `curl … | sh`
  command and the `npx wsb-tui` alternative.

## Invariants

- No domain rule in the shell; core owns offsets, progress, formatting and the
  reminder schedule.
- Every runtime user-facing string is a translation key from the same
  catalogues as the web shell.
- The shell ships only the public Supabase URL + anon key (read-only RLS); no
  service-role key. It never contacts MORA at runtime.
- The bundle contains no remote code and no analytics.
- No terminal UI framework dependency: the renderer is ANSI on `tty`.

## Acceptance criteria

- [ ] The interface renders the eight entries in order for the selected
      district.
- [ ] Selecting Tutong/Belait shifts the entries by +1/+3 minutes.
- [ ] The current entry is highlighted and the duration to next is shown.
- [ ] District, language and time format survive a restart.
- [ ] `q` and `Esc` exit and restore the terminal state.
- [ ] Piped stdout prints plain lines and no escape sequences.
- [ ] `--json` prints one JSON object with the day and progress.
- [ ] Times fall back to the last known day when the source is unreachable.
- [ ] With no Supabase configuration the interface shows the unavailable state.
- [ ] The build produces an npm tarball and a standalone binary.
- [ ] The installer prints how to run the shell once it finishes.

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
