#!/usr/bin/env bash

set -euo pipefail

DISPLAY_NUMBER="${DISPLAY:-:0}"
DISPLAY_NUMBER="${DISPLAY_NUMBER#:}"
DISPLAY_VALUE=":${DISPLAY_NUMBER}"
LOG_DIR="${HOME}/.cache/grader-app-devcontainer"
XVFB_LOG="${LOG_DIR}/xvfb.log"
OPENBOX_LOG="${LOG_DIR}/openbox.log"
X11VNC_LOG="${LOG_DIR}/x11vnc.log"
NOVNC_LOG="${LOG_DIR}/novnc.log"
NOVNC_PROXY="/usr/share/novnc/utils/novnc_proxy"

mkdir -p "${LOG_DIR}"

is_listening() {
  local port="$1"
  ss -ltn "( sport = :${port} )" | tail -n +2 | grep -q .
}

start_if_missing() {
  local pattern="$1"
  local log_file="$2"
  shift 2

  if pgrep -u "${USER}" -f "${pattern}" >/dev/null 2>&1; then
    return 0
  fi

  nohup "$@" >>"${log_file}" 2>&1 &
}

start_if_missing "Xvfb ${DISPLAY_VALUE}" "${XVFB_LOG}" \
  Xvfb "${DISPLAY_VALUE}" -screen 0 1440x900x24 -ac -nolisten tcp

start_if_missing "openbox" "${OPENBOX_LOG}" \
  env DISPLAY="${DISPLAY_VALUE}" openbox

if ! is_listening 5900; then
  start_if_missing "x11vnc .*${DISPLAY_VALUE}" "${X11VNC_LOG}" \
    x11vnc -display "${DISPLAY_VALUE}" -forever -shared -rfbport 5900 -localhost -nopw
fi

if ! is_listening 6080; then
  if command -v novnc_proxy >/dev/null 2>&1; then
    start_if_missing "novnc_proxy .*6080" "${NOVNC_LOG}" \
      novnc_proxy --listen 6080 --vnc localhost:5900
  elif [ -x "${NOVNC_PROXY}" ]; then
    start_if_missing "${NOVNC_PROXY} .*6080" "${NOVNC_LOG}" \
      "${NOVNC_PROXY}" --listen 6080 --vnc localhost:5900
  else
    start_if_missing "websockify .*6080" "${NOVNC_LOG}" \
      websockify --web=/usr/share/novnc/ 6080 localhost:5900
  fi
fi

for _ in $(seq 1 30); do
  if is_listening 5900 && is_listening 6080; then
    exit 0
  fi
  sleep 1
done

echo "Desktop services did not become healthy. Check logs in ${LOG_DIR}." >&2
exit 1
