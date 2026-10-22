# wsb

Waktu Sembahyang Brunei in your terminal. Times come from the same core and
data as the web app; MORA/KHEU is the source, Supabase is the runtime backend.

## Run

```sh
npx wsb-tui
```

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/lordsayur/wsb/main/scripts/install.sh | sh
```

## Use

```sh
wsb                 # full-screen interface
wsb now             # current entry and time until the next
wsb --month         # the month table (or --month 2026-10)
wsb --date 2026-10-18
wsb --json          # one JSON object, then exit
wsb doctor          # configuration report
wsb update          # check for a newer release (--apply installs it)
```

Views: `1` day, `2` month, `3` trend (or `Tab`).

Keys: `q`/`Esc` quit, `d` district, `l` language, `f` 12/24-hour clock,
`j`/`k` scroll, `[`/`]` month, `r` refetch, `?` key help.

The source is Jabatan Hal Ehwal Ugama (KHEU), Brunei. This project is not
affiliated with them.
