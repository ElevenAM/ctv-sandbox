---
name: new-prototype
description: Scaffold a new prototype in this library and build it to the repo's standard — folder, registry entry, brief stub, then the real component with all four data states. Use when asked to "add a prototype", "start a new exercise", "build X as a prototype", or at the start of a timed technical exercise once the brief is understood. Args: a slug, optionally followed by what it should do (e.g. "kanban a drag-and-drop board with columns").
---

# /new-prototype <slug> [what it should do]

Creates a prototype and takes it to something openable. You are not just running the scaffold — you are delivering a working surface that satisfies [`CLAUDE.md`](../../../CLAUDE.md) and [`DESIGN.md`](../../../DESIGN.md).

## Procedure

1. **Understand before scaffolding.** Restate the ask in one sentence: what does someone *see*, and what can they *do*? If the brief is a paragraph, name the single primary journey. Everything below serves that journey; anything that does not is rung 1 of the ladder.

2. **Decide the data shape before the UI.** Three options, in ladder order:
   - **No persistence.** Client state only. Correct for anything an interviewer will judge on interaction rather than durability. Fastest, zero failure modes.
   - **`prototype_state`** (already exists, migration 0001). Per-visitor scratch keyed by prototype slug — owner-scoped by RLS, no migration needed. Correct for "remember my settings/progress".
   - **A new table.** Only when the shape is genuinely relational or shared between visitors. Costs a migration, a types regen, and RLS. Worth it for anything multiplayer.

   Say which you picked and why, in one line.

3. **Scaffold.** `pnpm new <slug> --title "..." --tone <amber|iris|jade|rose|slate> --tags "a,b,c"`
   This writes `meta.ts`, `Prototype.tsx`, the brief stub, and the registry line. **Never hand-write these** — the script assigns the index code and gets the registry insert right.

4. **Fill in `meta.ts` immediately.** `tagline` and `summary` are the gallery copy; leaving them as TODO is a visible defect on the front page. Set `capabilities` honestly — it is what tells the next session whether this needs the database.

5. **If it needs a new table**, write the migration first, then apply it, then regenerate types:
   - `supabase/migrations/NNNN_<name>.sql` — RLS in the same file, four policies not one `FOR ALL`, `with check` on insert (rules 9–10).
   - Apply via the Supabase MCP `apply_migration` against `thibkcpuvbskzznconzg`.
   - `pnpm db:types`, then `get_advisors` — it must come back clean (rule 13).
   - Copy the policy shape from `supabase/migrations/0002_signal_board.sql`; it is the worked reference for public-read / owner-write.

6. **Build the component.** Climb the ponytail ladder first (CLAUDE.md §Code shape). Non-negotiable regardless of the clock:
   - All four data states, imported from `primitives.tsx`. **Write the failed state first** — it is the one that gets skipped and the one that gets checked.
   - `Result<T>` at every boundary that can fail. Map `reason` to human copy; never render it.
   - Tokens and `.type-*` roles only. No raw hex, no bare font-size.
   - One primary action, the only `brand` fill on the screen.
   - A cancellation guard on every `await` inside an effect (rule 7).

7. **Open it.** `pnpm dev`, then `http://localhost:3000/p/<slug>`. Drive it in the browser — click the primary action, trigger the failed state, resize to 375px, flip the theme. **A prototype you have not opened is not done** and must not be reported as working.

8. **Gate and report.** `pnpm gate` must be green. Then say, in this order: the URL, what it does, what you deliberately left out, and anything you could not verify.

## Invariants

- The scaffold script is the only way a registry entry gets written.
- A prototype never renders page chrome — the shell in `layout.tsx` gives it a header, footer, and skip link for free. It is one component.
- A prototype is self-contained: deleting its folder plus its registry line leaves nothing broken. If you find yourself editing `src/app/` or `primitives.tsx` to make one prototype work, stop — either it belongs in the shared layer for everyone, or it belongs inside the prototype.
- `status: 'draft'` until you have opened it. Then `'live'`.
