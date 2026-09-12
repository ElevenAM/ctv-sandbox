# PROGRESS.md

Living state. Keep it short — this is Now and Parked, not a diary.

## Now
- **Blocked on one owner action: create the Vercel project.** The repo is on
  `origin/main` and the build is green locally, but this machine's Vercel MCP
  connection is read-only for project creation (`403 forbidden`), and the CLI
  is not logged in. One-time fix, either:
  - dashboard → Add New → Project → import `ElevenAM/ctv-sandbox`, or
  - `npx vercel link && npx vercel --prod` from the repo root.
  Then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  in the project's env vars. After that, push-to-deploy works and `/ship` can
  drive it over MCP.

## Parked
- **No unit test suite yet.** `vitest` is installed and `pnpm test` is wired, but nothing is written. The first prototype with non-trivial pure logic should bring the first test — `src/lib/color.ts` (contrast maths) is the obvious candidate. Note the RLS side is now covered by `pnpm check:rls`.
- **`supabase config push` is still unavailable** — the CLI is not logged in on this machine, so `supabase/config.toml` is version-controlled but not the thing actually applying settings. Dashboard changes are the source of truth until `supabase login` happens.

## Log
- `2026-09-12` — Anonymous sign-in enabled on the project. Verified the whole
  multiplayer path end to end in a browser: post, realtime INSERT across two
  tabs, realtime DELETE, and the correct fall back to the empty state. Added
  `pnpm check:rls` — ten two-anon-client negatives, all passing, proving the
  database *refuses* cross-user writes rather than the UI merely hiding them.
- `2026-09-11` — Repo created. Next 16 + Supabase + Vercel + design system + registry + 6 skills + 6 MCP servers. Two reference prototypes (EX-01 signal-board, EX-02 token-lab). Gate green.
