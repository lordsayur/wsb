# AGENTS.md

Single source of truth for all agents working in this repo. Per-agent files are
thin pointers back here — never fork this content.

## Project

`wsb` — TypeScript monorepo managed with pnpm workspaces.

- `apps/web` — Nuxt web app (dev server on `0.0.0.0:5173`).
- `apps/extension` — Manifest V3 browser extension (popup, page header,
  notifications; zip on GitHub releases).
- `packages/core` — thick core: all domain logic (`packages/shared` is being
  split into this and `packages/data`).
- `packages/data` — backend-agnostic data port + adapters.

`VISION.md` is what/why. `specs/` is the how: one spec per bounded context.

## Commands

Run everything **inside the devcontainer** (never install deps on the host).

```bash
pnpm install          # install workspace deps
pnpm dev              # run the web app (0.0.0.0:5173)
pnpm build            # build all packages
pnpm typecheck        # typecheck all packages
pnpm lint             # lint all packages
pnpm extension:build  # bundle the browser extension into apps/extension/dist
pnpm extension:zip    # also write apps/extension/wsb-extension.zip
```

## Conventions

- Branch: `main`. Never `master`.
- pnpm workspaces; cross-package imports use `workspace:*`.
- TypeScript strict mode; `tsconfig.base.json` holds shared compiler options.
- No new dependency if it can be avoided.

## Internationalization

All user-facing text goes through **Nuxt I18n** (`@nuxtjs/i18n`, powered by Vue
I18n). No hard-coded UI strings.

- Default locale: **Malay (`ms`)**. English (`en`) is the fallback.
- Messages live in `apps/web/i18n/locales/<locale>.json`.
- Use `$t` / `useI18n().t` for text and `$d` / `$n` for locale-aware dates and
  numbers.
- Prayer names are domain values (`PrayerName`); their labels are translation
  keys the shell maps to. Never translate domain identifiers.
- Every new key lands in `ms` first; missing keys are a bug.

## Spec-driven development

`specs/` is the source of truth for behavior; code is a rendering of it. Read
the spec for the context you touch, change the spec first when behavior changes,
then make the code match.

- `specs/README.md` — the workflow.
- `specs/CONTEXT-MAP.md` — bounded contexts and dependency rules.
- `specs/glossary.md` — ubiquitous language; define a term once, here.
- `specs/<context>/spec.md` — one spec per bounded context.
- `specs/templates/context-spec.md` — copy when adding a context.
- `specs/legacy/business-rules.md` — the old app's rules (reference).
- `specs/legacy/parity.md` — adopt/override/drop checklist for those rules.

Rules: one spec per bounded context; behavior changes and spec changes ship
together; acceptance criteria are the test list; no `active` spec, no
implementation of that behavior. The legacy rules are inputs, not authority: if
they conflict with a context spec, the spec wins and parity records the
override.

## Domain-driven design

Split by domain, not by layer. Respect the context map.

- Shell → core → data-port. Never the reverse.
- The core (`packages/core`) owns all rules and is pure TypeScript: no DOM, no
  network, no Supabase, no framework.
- `packages/data` exposes only backend-agnostic types; no vendor type crosses
  the port.
- Shells (`apps/web`) render core state; zero business logic.
- `packages/shared` is not a context — do not add domain logic there.

## Ponytail

This repo runs in **ponytail** lazy-senior-dev mode. Before writing code, stop
at the first rung that holds:

1. Does this need building at all? (YAGNI)
2. Does it already exist here? Reuse it.
3. Does the standard library do it? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an installed dependency solve it? Use it.
6. Can it be one line?
7. Only then write the minimum that works.

Bug fix = root cause, not symptom. Mark deliberate corner-cuts with a
`ponytail:` comment naming the ceiling and upgrade path. Non-trivial logic
leaves one small runnable check behind.

## Graphify

A queryable knowledge graph is available through the MCP server in `.mcp.json`
(see `.agents/skills/graphify/`). It runs inside the devcontainer.

## Rules

- Never commit secrets. `.env` files are gitignored.
- Do not run project dependency installs on the host.

## Token optimization

This repo uses the shared **Strict Token Optimization Protocol**. The tools are
installed in the devcontainer (never the host): Graphify (`graphify`) for
navigation, CocoIndex Code (`ccc`) for AST extraction, Ponytail for minimal code,
and Headroom (`headroom` / `snip`) for trimming command output.

Install/refresh inside the container:

```bash
uv tool install --force 'graphifyy[mcp]'
uv tool install --force 'cocoindex-code[full]'
uv tool install --force --python 3.13 'headroom-ai[all]'
ccc init
graphify install --project --platform agents
```

After a `git pull`/merge, run `graphify update .` to resync the graph.

### Strict Token Optimization Protocol

1. NAVIGATE: Use Graphify to map architecture; do not run raw greps.
2. EXTRACT: Use CocoIndex Code (`ccc`) to read AST chunks for files >150 lines.
3. GENERATE: Apply Ponytail standards (zero boilerplate, max density).
4. EXECUTE: Prefix all terminal builds/tests with `headroom` or `snip`.
5. DATA: Read/write all JSON payloads in TOON format to save tokens.

## Testing and Storybook

`pnpm test` runs the whole suite: `packages/core`, `packages/data`, and
`apps/web` (unit + Storybook stories executed in headless Chromium via
`@storybook/experimental-addon-test` + `@vitest/browser`).

- Unit tests live beside the code (`*.test.ts`), node environment.
- Stories are the component tests: every atom/molecule/organism has
  `*.stories.ts` with default/loading/error/edge coverage and `play` functions
  for interaction.
- Stories must not need the Nuxt runtime: inject dependencies, provide fakes.
- Playwright Chromium is installed in the devcontainer and CI.

## Always-on dev + routeup

```bash
./dev.sh develop   # app dev :5173 + Storybook :6006, exposed
./dev.sh app | storybook | routeup | stop
```

Public URLs: https://wsb.try.routeup.dev and
https://wsb-storyboook.try.routeup.dev. Agents start this stack when development
begins and leave it running unless asked.

## Netlify

Deploy on demand only, to project `wsb-next`. Netlify CLI is installed inside
the devcontainer. Build config is `netlify.toml`; never commit secrets.
