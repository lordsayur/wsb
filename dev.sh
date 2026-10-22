#!/usr/bin/env bash
# Start the wsb stack inside the devcontainer and expose it publicly.
#
# Usage:
#   ./dev.sh develop    # web dev (:5173) + Storybook (:6006), both exposed
#   ./dev.sh app        # web dev only
#   ./dev.sh storybook  # Storybook only
#   ./dev.sh routeup    # public routes only
#   ./dev.sh stop       # stop dev servers and routes
#
# Safe to re-run: each step stops any server already on its port, then restarts.
set -euo pipefail

# specs/web/spec.md — one dev server owns apps/web/.nuxt. Running on the host
# and in the devcontainer at once means two processes write the same checkout
# through different paths and corrupt the Vite/Nuxt output. Refuse on the host.
if [ ! -f /.dockerenv ] && [ -z "${REMOTE_CONTAINERS:-}" ] && [ -z "${CODESPACES:-}" ]; then
  echo "dev.sh must run inside the devcontainer (see AGENTS.md)." >&2
  echo "If you already have a server running there, use it instead of starting another." >&2
  exit 1
fi

cd "$(dirname "$0")"
ROOT="$(pwd)"

# Build output is only releasable by its owner. Running the dev servers as root
# leaves .nuxt, dist and .netlify unreadable to the normal user, and the next
# build fails with EACCES. specs/web/spec.md — the devcontainer user owns them.
if [ "$(id -u)" = "0" ]; then
  echo "dev.sh must not run as root; that leaves root-owned build output." >&2
  echo "Run it as the devcontainer user (vscode), then fix any leftovers with:" >&2
  echo "  sudo chown -R \"\$(id -un)\":\"\$(id -gn)\" $(pwd)" >&2
  exit 1
fi

APP_PORT="${APP_PORT:-5173}"
STORYBOOK_PORT="${STORYBOOK_PORT:-6006}"
APP_ROUTE="${APP_ROUTE:-wsb}"
STORYBOOK_ROUTE="${STORYBOOK_ROUTE:-wsb-storyboook}"
LOG_DIR="${LOG_DIR:-/tmp}"
APP_LOG="$LOG_DIR/wsb-dev.log"
STORYBOOK_LOG="$LOG_DIR/wsb-storybook.log"

# A log left behind by a root-run server blocks the rewrite; take it back.
claim_log() {
  local file="$1"
  [ -e "$file" ] || return 0
  [ -w "$file" ] && return 0
  sudo -n rm -f "$file" 2>/dev/null || true
}

routeup_bin() {
  if command -v routeup >/dev/null 2>&1; then
    command -v routeup
  elif [ -x "${HOME}/.local/bin/routeup" ]; then
    echo "${HOME}/.local/bin/routeup"
  else
    echo routeup
  fi
}

stop_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    # A server started by the container entrypoint runs as root; the normal
    # user cannot signal it, so retry with sudo when available.
    if fuser "${port}/tcp" >/dev/null 2>&1; then
      sudo -n fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
  fi
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local tries="${3:-90}"
  for _ in $(seq 1 "$tries"); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "$label ready: $url"
      return 0
    fi
    sleep 1
  done
  echo "$label did not become ready: $url (see log)" >&2
  return 1
}

start_app() {
  stop_port "$APP_PORT"
  sleep 1
  claim_log "$APP_LOG"
  echo "app: nuxt dev on :${APP_PORT} (log: $APP_LOG)"
  setsid nohup pnpm --filter web exec nuxt dev \
    --host 0.0.0.0 --port "$APP_PORT" --dotenv=../../.env \
    > "$APP_LOG" 2>&1 < /dev/null &
  disown
  wait_for_http "http://127.0.0.1:${APP_PORT}/" "app" 120
}

start_storybook() {
  stop_port "$STORYBOOK_PORT"
  sleep 1
  claim_log "$STORYBOOK_LOG"
  echo "storybook: dev on :${STORYBOOK_PORT} (log: $STORYBOOK_LOG)"
  setsid nohup pnpm --filter web exec storybook dev \
    -p "$STORYBOOK_PORT" --host 0.0.0.0 --ci --no-open \
    > "$STORYBOOK_LOG" 2>&1 < /dev/null &
  disown
  wait_for_http "http://127.0.0.1:${STORYBOOK_PORT}/" "storybook" 180
}

start_route() {
  local name="$1"
  local port="$2"
  local bin
  bin="$(routeup_bin)"
  "$bin" stop "$name" >/dev/null 2>&1 || true
  sleep 1
  echo "routeup: serving $name -> :${port}"
  "$bin" serve "$name" --port "$port" --expose --detach --json
}

start_routes() {
  start_route "$APP_ROUTE" "$APP_PORT"
  start_route "$STORYBOOK_ROUTE" "$STORYBOOK_PORT"
}

stop_all() {
  local bin
  bin="$(routeup_bin)"
  "$bin" stop "$APP_ROUTE" >/dev/null 2>&1 || true
  "$bin" stop "$STORYBOOK_ROUTE" >/dev/null 2>&1 || true
  stop_port "$APP_PORT"
  stop_port "$STORYBOOK_PORT"
  echo "stopped app, storybook, and routes"
}

case "${1:-develop}" in
  develop)
    start_app
    start_storybook
    start_routes
    echo "public: https://${APP_ROUTE}.try.routeup.dev"
    echo "public: https://${STORYBOOK_ROUTE}.try.routeup.dev"
    ;;
  app)
    start_app
    ;;
  storybook)
    start_storybook
    ;;
  routeup)
    start_routes
    ;;
  stop)
    stop_all
    ;;
  *)
    echo "usage: $0 [develop|app|storybook|routeup|stop]" >&2
    exit 2
    ;;
esac
