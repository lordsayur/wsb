# AGENTS.md

Single source of truth for all agents working in this repo. Per-agent files are
thin pointers back here — never fork this content.

## Project

`wsb` — TypeScript monorepo managed with pnpm workspaces.

- `apps/web` — Vite web app (dev server on `0.0.0.0:5173`).
- `packages/shared` — reusable TypeScript library imported by apps.

## Commands

Run everything **inside the devcontainer** (never install deps on the host).

```bash
pnpm install          # install workspace deps
pnpm dev              # run the web app (0.0.0.0:5173)
pnpm build            # build all packages
pnpm typecheck        # typecheck all packages
pnpm lint             # lint all packages
```

## Conventions

- Branch: `main`. Never `master`.
- pnpm workspaces; cross-package imports use `workspace:*`.
- TypeScript strict mode; `tsconfig.base.json` holds shared compiler options.
- No new dependency if it can be avoided.

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
