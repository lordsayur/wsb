# wsb

TypeScript monorepo (pnpm workspaces).

## Layout

- `apps/web` — Vite web app.
- `packages/shared` — shared TypeScript library.

## Development

Everything runs inside the devcontainer.

```bash
pnpm install
pnpm dev        # http://localhost:5173 (bound to 0.0.0.0)
pnpm build
pnpm typecheck
```

Open in the devcontainer:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . pnpm dev
```

## Exposing the dev server (routeup)

From inside the devcontainer:

```bash
routeup setup --no-bind --port 8443 --server https://edge.routeup.dev
routeup serve wsb --port 5173 --expose
```

## Agent tooling

- `AGENTS.md` is the single source of truth for all agents.
- ponytail rules: `.agents/skills/ponytail/`.
- Graphify MCP server: `.mcp.json`.
