#!/bin/sh
# Installs the wsb TUI from GitHub releases. specs/tui/spec.md — picks the
# binary for this OS/arch, verifies its checksum and fails closed on mismatch.
# Usage: curl -fsSL https://raw.githubusercontent.com/lordsayur/wsb/main/scripts/install.sh | sh
# Override: WSB_VERSION=v1.2.3 WSB_BIN_DIR="$HOME/bin"
set -eu

REPO="lordsayur/wsb"
VERSION="${WSB_VERSION:-latest}"
BIN_DIR="${WSB_BIN_DIR:-$HOME/.local/bin}"

os="$(uname -s)"
arch="$(uname -m)"

case "$os" in
  Linux) os="linux" ;;
  Darwin) os="darwin" ;;
  *) echo "wsb: unsupported OS: $os" >&2; exit 1 ;;
esac

case "$arch" in
  x86_64|amd64) arch="x64" ;;
  aarch64|arm64) arch="arm64" ;;
  *) echo "wsb: unsupported architecture: $arch" >&2; exit 1 ;;
esac

name="wsb-tui-${os}-${arch}"
[ "$os" = "windows" ] && name="${name}.exe"

if [ "$VERSION" = "latest" ]; then
  base="https://github.com/${REPO}/releases/latest/download"
else
  base="https://github.com/${REPO}/releases/download/${VERSION}"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "Downloading ${name}…"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "${base}/${name}" -o "${tmp}/${name}"
  curl -fsSL "${base}/${name}.sha256" -o "${tmp}/${name}.sha256"
else
  wget -q "${base}/${name}" -O "${tmp}/${name}"
  wget -q "${base}/${name}.sha256" -O "${tmp}/${name}.sha256"
fi

expected="$(awk '{print $1}' "${tmp}/${name}.sha256")"
if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "${tmp}/${name}" | awk '{print $1}')"
else
  actual="$(shasum -a 256 "${tmp}/${name}" | awk '{print $1}')"
fi

if [ "$expected" != "$actual" ]; then
  echo "wsb: checksum mismatch — refusing to install" >&2
  exit 1
fi

mkdir -p "$BIN_DIR"
install -m 0755 "${tmp}/${name}" "${BIN_DIR}/wsb"

echo "Installed wsb to ${BIN_DIR}/wsb"
case ":$PATH:" in
  *":${BIN_DIR}:"*) on_path=1 ;;
  *) on_path=0 ;;
esac

cat <<EOF

Run it:
  wsb                 full-screen prayer times
  wsb now             current entry and time until the next
  wsb --month         the month table (or --month 2026-10)
  wsb --json          today's times as one JSON object
  wsb --date DATE     another day (YYYY-MM-DD)
  wsb doctor          check the version, state file and data source
  wsb update          check for a newer release (--apply installs it)

Views: 1 day, 2 month, 3 trend (or Tab).
Keys: q quit, d district, l language, f 12/24h, j/k scroll, [ ] month, r reload, ? keys.

EOF

if [ "$on_path" = "0" ]; then
  cat <<EOF
${BIN_DIR} is not on your PATH. Add it, then open a new shell:
  echo 'export PATH="${BIN_DIR}:\$PATH"' >> ~/.profile

EOF
fi
