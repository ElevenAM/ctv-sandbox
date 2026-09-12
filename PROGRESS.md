# PROGRESS.md

Living state. Keep it short — this is Now and Parked, not a diary.

## Now
- Kit is built and green. Nothing in flight.

## Parked
- **No test suite yet.** `vitest` is installed and `pnpm test` is wired, but nothing is written. The first prototype with non-trivial pure logic should bring the first test — `src/lib/color.ts` (contrast maths) is the obvious candidate.
- **`pgTAP` RLS negatives.** The RLS in `supabase/migrations/` is reviewed but not *tested* — there is no two-anon-client negative proving one visitor cannot delete another's note. Worth adding before any prototype here holds something that matters.
- **Anonymous sign-in is a manual dashboard toggle** until the Supabase CLI is logged in on this machine (`supabase login`, then `supabase config push` picks it up from `config.toml`).

## Log
- `2026-09-11` — Repo created. Next 16 + Supabase + Vercel + design system + registry + 6 skills + 6 MCP servers. Two reference prototypes (EX-01 signal-board, EX-02 token-lab). Gate green.
