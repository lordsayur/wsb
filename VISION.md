# wsb — Waktu Sembahyang Brunei

Brunei prayer times, everywhere, with as little as possible.

## What it is

`wsb` is a single, tiny, offline-first prayer-time app for Brunei, exposed
through many thin platform shells. The core job: show the correct prayer times
for the user's district, fast and correct, on any surface.

## Current state: pipeline first

- The backend is **Supabase** for now (Postgres + optional Auth). There is no
  custom backend service.
- Development uses Supabase as the only runtime source. Every shell is offline
  first: the device cache renders, Supabase refreshes it.
- MORA is an import-time source: a manual monthly job copies the month into
  Supabase. No shell contacts MORA at runtime.
- Priority is the **end-to-end pipeline**: spec → test → code → Storybook
  component tests → always-on local dev → public routeup preview → manual
  Netlify deploy. Real Supabase data comes after that path is boring and
  reliable, and it swaps in behind the port without touching core or shells.
- Netlify is **deploy on demand**: nothing is deployed until explicitly asked.

## Core feature

- Display Brunei prayer times.
- District selection, defaulting to **Brunei & Muara** (= **Temburong**; same
  times).
- Fixed per-district offsets from the default:
  - Tutong: **+1 minute**
  - Belait: **+3 minutes**
- Minimal resource use: small payload, no network required after first load.

## Secondary feature: Quran Ayat

- A web-only `/ayat` page inside the same PWA: one Quran ayah at random from a
  range the reader chooses by juz and surah.
- Arabic only. The reader reveals the juz, surah, ayah number or the next ayah
  on demand; nothing is disclosed before that.
- The corpus is static, bundled and loaded lazily by juz, so the main page
  bundle and the offline-first rule are unchanged.
- The prayer-time core stays the product's centre; this is a separate bounded
  context with its own spec (`specs/quran/spec.md`).

## Architecture: thin shell, thick core

```
apps/*            thin shells   — rendering + platform glue only
packages/core     thick core    — all logic: districts, offsets, scheduling, state
packages/data     data port     — storage/backend abstraction
```

- **Shells** never own business logic. They read state from core and draw it.
- **Core** owns every rule (district offsets, time math, formatting, selection
  persistence contract) and is platform-agnostic, pure TypeScript.
- This is what makes adding a new platform cheap: a shell is a view over the
  same core.

## Backend & data layer

- **No custom backend.** Supabase is the backend for now: Postgres for data,
  Supabase Auth if accounts are ever needed.
- The core depends on a **data port** (interface), not on Supabase. The Supabase
  adapter is one implementation behind that port, so swapping to another backend
  (REST, SQLite, another BaaS) is a new adapter, not a rewrite.
- No Supabase (or other vendor) types may leak into core or shells.

## Offline first

- The app works with no network. Cached/local prayer data is the source of
  truth for rendering; remote data only refreshes it.
- First-run and refresh degrade gracefully; the last known good data is always
  shown.

## Platforms

One core, many shells. Focus order:

1. **PWA (web)** — first and primary target.
2. Browser extension
3. CLI
4. TUI
5. VS Code extension
6. Raycast extension
7. …and more as the shell cost stays near zero.

## UI: atomic design

UI is built in atomic design layers, on the shell side but kept dumb:

- **Atoms** — prayer name, time text, district chip, icon.
- **Molecules** — a single prayer row, a district selector.
- **Organisms** — the prayer-time list, the header/settings block.
- **Templates** — layout with slots, no data.
- **Pages** — a template wired to core state.

Rules: atoms/molecules are pure and prop-driven; no shell-specific business
logic. Data flows in from core; components only render it. This keeps
components reusable across every platform shell.

## Storybook

Storybook JS is the component workshop **and** the component test runner.

- Every atom, molecule and organism has stories covering its states
  (default, loading, error, edge values) before it ships.
- Stories double as tests: `play` functions drive real user interaction
  (select a district, assert the time offset) and run **headless in CI and
  locally through Vitest browser mode** (`@storybook/experimental-addon-test`
  + `@vitest/browser` + Playwright Chromium).
- `pnpm test` runs both the unit suite and the story suite, so components are
  covered by the normal command. No separate component test harness.
- A story is required for new shared UI; a component without stories is
  unfinished.
- Storybook is a devcontainer-local tool, consistent with everything else.

## Engineering practice

- **Test-driven development.** Core is written test-first.
- **Unit tests** for domain logic (offsets, time math, selection, data port).
- **End-to-end tests** for shells (a real user flow through the PWA).
- **Storybook** for components: stories double as component tests via `play`
  functions run headless in CI.
- **Latest tooling (VoidZero stack):** Vite / Rolldown / Vitest / Oxc for
  build, test, lint and format — one fast toolchain, minimal config.
- **Spelling checker** in CI/hooks.
- **Git hooks** enforcing checks locally before they reach CI.
- **Conventional commit** messages, enforced by hooklint.
- **Formatter + linter** run automatically; zero-friction, no manual cleanup.
- **Developer experience first.** Fast feedback loops, one command per task.

## Local development only

Every feature is exercised locally inside the devcontainer — never on the host.

- **devcontainer** is the single dev environment.
- **Docker Compose** runs external services, e.g. the **Supabase local stack**
  (`supabase start`), so tests and the app talk to a local Postgres, not
  production.

### Always-on dev servers

Development keeps both surfaces running and publicly reachable:

| Surface | Local port | Public URL |
| --- | --- | --- |
| Web app (Nuxt dev, HMR) | `5173` | `https://wsb.try.routeup.dev` |
| Storybook (dev server) | `6006` | `https://wsb-storyboook.try.routeup.dev` |

- `./dev.sh` starts the app dev server and Storybook, then (re)serves both
  routes through routeup with `--expose --detach`.
- Agents start and verify this stack when development begins, and leave it
  running. They do not tear it down without being asked.
- Storybook is a development surface only; it is never part of the production
  deploy.

## Delivery: Netlify

- The web shell deploys to Netlify project **`wsb-next`**
  (https://app.netlify.com/projects/wsb-next/overview), repointed from its old
  repo to **`lordsayur/wsb`**.
- Netlify CLI is installed **inside the devcontainer** (never on the host).
- Deploy only when explicitly asked. Build settings live in `netlify.toml`
  (base `apps/web`, Nuxt preset, Node 20+); secrets stay out of the repo.
- routeup URLs are development previews; the Netlify URL is production.

## Non-goals (for now)

- No custom backend service.
- No user accounts or cloud sync beyond what the data port needs.
- No heavy UI framework tax on the shells; keep them thin.
- No bespoke design system — atomic design + Storybook is the system.
