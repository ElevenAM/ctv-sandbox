#!/usr/bin/env bash
#
# Starts the dev server with Node on PATH.
#
# Exists because tool runners (the Browser pane's preview, editor tasks, launchd)
# do not inherit a login shell, so fnm's Node is invisible to them and pnpm's
# shim dies with `env: node: No such file or directory`. Same bootstrap as
# scripts/ci-local.sh — change both together.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  if [ -x "$HOME/.local/share/fnm/aliases/default/bin/node" ]; then
    export PATH="$HOME/.local/share/fnm/aliases/default/bin:$PATH"
  elif command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env)"
  else
    echo "✗ node not found. Install it, or run: eval \"\$(fnm env)\"" >&2
    exit 1
  fi
fi

exec pnpm dev "$@"
