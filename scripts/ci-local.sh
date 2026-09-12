#!/usr/bin/env bash
#
# The gate. This IS CI — there is no GitHub Actions workflow on this repo, so
# a green run here is the only thing that means "it works".
#
#   bash scripts/ci-local.sh          # everything
#   bash scripts/ci-local.sh quick    # typecheck + lint only (no build)
#
# Ordered cheapest-first so a broken type fails in seconds rather than after a
# two-minute build.
set -euo pipefail

cd "$(dirname "$0")/.."

# Node lives under fnm and is not on a bare shell's PATH.
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

SUBSET="${1:-all}"
FAILED=()

step() {
  local name="$1"; shift
  printf '\n\033[1m▸ %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m  ✓ %s\033[0m\n' "$name"
  else
    printf '\033[31m  ✗ %s\033[0m\n' "$name"
    FAILED+=("$name")
  fi
}

step "typecheck" pnpm typecheck
step "lint" pnpm lint

if [ "$SUBSET" != "quick" ]; then
  # The build is the real gate: it is what Vercel runs, and it catches the
  # Server/Client Component mistakes that tsc alone will not.
  step "build" pnpm build
fi

# Type drift: migrations changed but database.types.ts did not. Advisory here
# rather than blocking, because the check cannot tell a no-op DDL from a real
# schema change — but if it fires and you did change a column, you have found
# tomorrow's silent null (CLAUDE.md rule 11).
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  if ! git diff --quiet --cached -- supabase/migrations 2>/dev/null ||
     ! git diff --quiet -- supabase/migrations 2>/dev/null; then
    if git diff --quiet -- src/lib/supabase/database.types.ts 2>/dev/null &&
       git diff --quiet --cached -- src/lib/supabase/database.types.ts 2>/dev/null; then
      printf '\n\033[33m  ! migrations changed but database.types.ts did not — run: pnpm db:types\033[0m\n'
    fi
  fi
fi

printf '\n'
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[32m━━ gate green ━━\033[0m\n\n'
  exit 0
fi

printf '\033[31m━━ gate red: %s ━━\033[0m\n\n' "${FAILED[*]}"
exit 1
