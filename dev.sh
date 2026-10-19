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

cd "$(dirname "$0")"
ROOT="$(pwd)"

APP_PORT="${APP_PORT:-5173}"
STORYBOOK_PORT="${STORYBOOK_PORT:-6006}"
APP_ROUTE="${APP_ROUTE:-wsb}"
STORYBOOK_ROUTE="${STORYBOOK_ROUTE:-wsb-storyboook}"
LOG_DIR="${LOG_DIR:-/tmp}"
APP_LOG="$LOG_DIR/wsb-dev.log"
STORYBOOK_LOG="$LOG_DIR/wsb-storybook.log"

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
