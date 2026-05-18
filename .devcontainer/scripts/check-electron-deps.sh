#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DISPLAY_VALUE="${DISPLAY:-<unset>}"
ELECTRON_BIN="${ROOT_DIR}/node_modules/electron/dist/electron"

echo "Workspace: ${ROOT_DIR}"
echo "DISPLAY: ${DISPLAY_VALUE}"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm: $(pnpm --version)"
else
  echo "pnpm: missing"
fi

if ss -ltn "( sport = :6080 )" | tail -n +2 | grep -q .; then
  echo "noVNC: listening on 6080"
else
  echo "noVNC: not listening on 6080"
fi

if ss -ltn "( sport = :5900 )" | tail -n +2 | grep -q .; then
  echo "VNC: listening on 5900"
else
  echo "VNC: not listening on 5900"
fi

if [ -x "${ELECTRON_BIN}" ]; then
  echo "Electron binary: ${ELECTRON_BIN}"
  if missing="$(ldd "${ELECTRON_BIN}" | grep 'not found' || true)" && [ -n "${missing}" ]; then
    echo "Missing shared libraries:"
    echo "${missing}"
  else
    echo "Shared library check: OK"
  fi
else
  echo "Electron binary not found. Run 'pnpm install' first."
fi
