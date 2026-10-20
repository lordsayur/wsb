# wsb — Waktu Sembahyang Brunei

Brunei prayer times, everywhere, with as little as possible. Offline-first,
thin shells over one thick core, test-driven, no backend of our own.

See [`VISION.md`](./VISION.md) for the full product and engineering vision.

## Layout

- `apps/web` — Nuxt PWA (first target). Thin shell: rendering only, all text
  through Nuxt I18n (default Malay). Installable and offline-capable via
  `@vite-pwa/nuxt`; a waiting new build surfaces a reload prompt
  (`registerType: "prompt"`).
- `packages/core` — thick core: districts, offsets, prayer order, time math,
  selection rules. Pure TypeScript, no framework.
- `apps/extension` — Manifest V3 browser extension (popup, on-page header,
  notifications). Reads the public MORA source through the data port; ships as
  a zip on GitHub releases.
- `packages/data` — backend-agnostic, offline-first data port. Supabase is the
  only runtime source; MORA feeds Supabase through a manual monthly import.
  `packages/shared` is a leftover placeholder; do not add domain logic there.
- `specs/` — spec-driven development. One spec per bounded context; see
  [`specs/README.md`](./specs/README.md) and [`specs/CONTEXT-MAP.md`](./specs/CONTEXT-MAP.md).
  The old app's rules and their adopt/override/drop checklist live in
  [`specs/legacy/`](./specs/legacy/).

## Development

Everything runs inside the devcontainer.

```bash
pnpm install
pnpm dev        # web app dev server on 0.0.0.0:5173
pnpm dev:all    # app + Storybook, exposed through routeup
pnpm test       # core + data + extension + web unit + Storybook component tests
pnpm typecheck
pnpm build
```

## Browser extension

```bash
pnpm extension:build   # bundles into apps/extension/dist (unpacked)
pnpm extension:zip     # also writes apps/extension/wsb-extension.zip
```

Load `apps/extension/dist` via `chrome://extensions` → Developer mode → Load
unpacked. The popup shows the day's times, district/language/format choices,
notification opt-in, and an on-page-header toggle (on by default). The
background worker schedules reminders with `chrome.alarms`, so they fire while
the browser runs even with the popup closed.

Release: push a `v*` tag; `.github/workflows/extension-release.yml` attaches
`wsb-extension.zip` to the GitHub release. The web app's `/download` page (menu
→ Other platforms) links to
`https://github.com/lordsayur/wsb/releases/latest/download/wsb-extension.zip`.

## VS Code extension

```bash
pnpm vscode:build     # bundles into apps/vscode/dist
pnpm vscode:package   # also writes apps/vscode/wsb-vscode.vsix
```

The status bar shows the current entry and its time (the next one lives in the
tooltip); clicking it opens a sidebar view with all eight entries,
district/language/format choices and a link to the web app (`wsb.*` settings).
Opt-in reminders fire 15 minutes before and at each prayer while VS Code runs;
the extension asks once, on first install. Times come from the editor cache
first, then Supabase. Install the release artifact via
`Extensions: Install from VSIX…`; the same release attaches
`wsb-vscode.vsix`, linked from the web app's `/download` page.

Open in the devcontainer:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . pnpm dev
```

## Always-on dev stack

`./dev.sh develop` starts the Nuxt dev server (`:5173`) and Storybook (`:6006`)
and exposes them publicly:

- App: https://wsb.try.routeup.dev
- Storybook: https://wsb-storyboook.try.routeup.dev

Other modes: `./dev.sh app`, `./dev.sh storybook`, `./dev.sh routeup`,
`./dev.sh stop`.

Routeup needs its one-time setup inside the container:

```bash
routeup setup --no-bind --no-trust --port 8443 --server https://edge.routeup.dev
```

## Local Supabase

The CLI is not installed globally; use `npx supabase` (or install it inside the
devcontainer). The stack uses the repo's own Docker containers on
`:54321` (API/Studio) and `:54322` (Postgres).

```bash
npx supabase start      # first run pulls images; seeds prayer_times
npx supabase status     # prints URL + anon/service-role keys as env
npx supabase db reset   # re-run migrations + seed/prayer_times.sql
npx supabase stop
```

Copy the public URL + anon key into `.env` (see `.env.example`); the importer
uses `SUPABASE_SERVICE_ROLE_KEY` from the same file. `npx supabase status -o env`
prints all of them.

## Deployment

Netlify project **`wsb-next`** (deploy on demand only). The CLI is installed in
the devcontainer. Build settings live in `netlify.toml`; nothing deploys until
explicitly requested.

## Prayer data source

Prayer times originate from the Brunei Ministry of Religious Affairs (KHEU)
page: <https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx> (the public
canonical host; `mora-prod.cwh.gov.bn` is internal). The app credits it in the
footer.

Every shell is **offline first**: it renders the device cache and refreshes from
**Supabase only**. MORA is an **import-time** source — a manual monthly job
copies one Brunei month into Supabase; no shell contacts MORA at runtime. With
no Supabase configuration the app shows the unavailable state; there is no fake
fallback.

`packages/data/src/mora.ts` reads the SharePoint list and normalizes one record
per prayer time (date, district, prayer, time). `supabase/migrations/` creates
the `prayer_times` table; `supabase/seed/prayer_times.sql` is a generated
snapshot (currently 2025-01-09 .. 2026-12-31; MORA has no rows for the first
week of January 2025).

```bash
# manual monthly import (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY;
# the service-role key never ships to a shell)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm import:mora
pnpm import:mora --month 2026-11          # a specific month
pnpm import:mora --dry-run                # fetch + normalize, write nothing
pnpm import:mora --sql > supabase/seed/prayer_times.sql
```

### Admin page

`/admin` imports a month and corrects individual times without a terminal. It
signs in with Google (Supabase Auth) and the `admin` Edge Function re-checks the
caller's email against the `admin_allowlist` table on every call; the
service-role key lives in the function's secrets only.

```bash
# one-time: apply the allowlist migration, then add the Google provider in
# the Supabase dashboard (Auth → Providers → Google)
npx supabase db push

# deploy the function and give it the service role (never in a shell build)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... \
  SUPABASE_ANON_KEY=...
npx supabase functions deploy admin

# allow an account (Supabase dashboard → table editor → admin_allowlist)
```

The browser extension embeds the public Supabase URL + anon key at build time:

```bash
WSB_SUPABASE_URL=... WSB_SUPABASE_ANON_KEY=... pnpm extension:zip
```

## Agent tooling

- `AGENTS.md` is the single source of truth for all agents.
- `specs/` is the source of truth for behavior (SDD + DDD).
- ponytail rules: `.agents/skills/ponytail/`.
- Graphify MCP server: `.mcp.json`.
