# Waktu Sembahyang Brunei — Raycast

The day's prayer times in the Raycast launcher. A thin shell over `@wsb/core`
and `@wsb/data`; see [`specs/raycast/spec.md`](../../specs/raycast/spec.md).

## Commands

- **Waktu Sembahyang** — the eight entries for the selected district, with the
  current entry marked, the duration to the next, and a district dropdown.

## Development

Set the public Supabase values in the repo root `.env` (the same ones the web
and browser shells use), then:

```bash
pnpm --filter ./apps/raycast build
```

`ray build` needs to run where the Raycast CLI can write; the build bakes
`WSB_SUPABASE_URL` / `WSB_SUPABASE_ANON_KEY` into the bundle at build time.

To try it locally, load `apps/raycast` in Raycast (`ray develop`) and run the
command. Without Supabase configuration the command shows the unavailable
state; there is no fake fallback.

## Publishing to the Raycast Store

```bash
pnpm raycast:store
cd apps/raycast/store/brunei-prayer-times
npm install                 # Store CI uses npm and needs package-lock.json
npm run build && npm run lint
npm run publish             # opens a PR against raycast/extensions
```

The export vendors `@wsb/core` and `@wsb/data` as generated files, commits the
public Supabase URL + anon key (read-only under RLS), and switches the manifest
metadata and defaults to English. Screenshots (2000×1250 PNG) must be captured
manually on macOS via Raycast's Window Capture.
