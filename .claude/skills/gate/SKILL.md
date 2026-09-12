---
name: gate
description: Run the full verification pass before claiming work is done — typecheck, lint, build, Supabase security advisors, type drift, and an actual browser check of the running page. Use before committing, before pushing, before reporting that something works, or when asked to "check everything", "verify", "is it ready", or "run the gate".
---

# /gate

The honesty check. Run it before any claim that something works.

There is no GitHub Actions workflow on this repo, so this is CI. A green gate is the only evidence that exists.

## Procedure

1. **`pnpm gate`** — typecheck, lint, build, in that order (cheapest first). All three must be green. A warning is not a failure but is reported.

2. **Database, if any migration was touched this session:**
   - `get_advisors` (security) on `thibkcpuvbskzznconzg` — must return an empty list. A new `WARN` is a blocking regression, not a note for later.
   - `get_advisors` (performance) — report findings; blocking only if a new index would be cheap.
   - Confirm `pnpm db:types` was run: `git diff --stat src/lib/supabase/database.types.ts` should be non-empty if `supabase/migrations/` changed in the same commit. `ci-local.sh` prints a warning for this, which is easy to scroll past — check it.
   - Spot-check RLS on any new table: it is enabled, and the insert policy has a `with check`.

3. **Browser check — the part that is actually load-bearing.** Compiling is not working.
   - `preview_start` the dev server (or open the deployed URL if the work is shipped).
   - Load each route that changed. Confirm it renders.
   - `read_console_messages` — a page that paints while throwing is not working.
   - Exercise the primary action on each changed prototype.
   - Trigger at least one failed state and confirm it says something true.

4. **Report.** Green or red, per step. For anything unverified, say which and why. Never round a skipped step up to a pass.

## Invariants

- Never report "it works" on the strength of a successful build.
- An advisor `WARN` introduced this session blocks. A pre-existing one is reported, not silently inherited.
- If the browser check could not run, the report says the page is unverified — not that it is fine.
