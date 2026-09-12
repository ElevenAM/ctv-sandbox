# PLAYBOOK.md — the first ten minutes

You have been dropped into this repo with a technical exercise and a clock. This is the sequence. [`CLAUDE.md`](CLAUDE.md) is the rules; this is the order of operations.

---

## Before anything

```bash
pnpm install && pnpm gate
```

If the gate is green, the whole platform works and **nothing about the infrastructure is your problem**. Next.js, Supabase, RLS, the design system, hosting, the MCP servers — all solved. Every minute from here goes into the exercise.

If the gate is red, fix that first and only that. See [Troubleshooting](#troubleshooting).

---

## The sequence

### 0–10 min · Scope it
Run **`/exercise-brief`** with the prompt. Come out with: one sentence, one ranked primary journey, an explicit out-of-scope list, the data shape, and the riskiest part.

Do not skip this because the clock is running. Unscoped work is how three things end up half-built.

### 10–20 min · Scaffold and **deploy an empty shell**
```bash
pnpm new <slug> --title "..." --tags "..."
```
Then **`/ship`** immediately — before the prototype does anything.

This is the highest-leverage move in the whole playbook. A URL that loads at minute 20 means every later minute has something live behind it, and any deploy problem surfaces while there is still time to solve it. Discovering a broken build at minute 85 is unrecoverable.

### 20–55 min · Build the primary journey
Rank 1, end to end, including the failed state. Follow **`/new-prototype`**.

If something is risky — realtime, drag-and-drop, an external API — spike a throwaway version of it **first**, before any polish.

### 55–70 min · Ship and verify
**`/ship`** again. Open the deployed page yourself and drive it. The clock stops mattering once this is green.

### 70–85 min · Rank 2, only if rank 1 is complete
A half-built second feature is worth less than nothing. If rank 1 has rough edges, spend this on rank 1.

### 85–90 min · Review and write up
**`/screen-review <slug>`**, fix what is cheap, update the brief. Write the two paragraphs explaining what you built and what you left out — **this is scored**, and it is where the out-of-scope list earns its keep.

---

## What actually scores

1. **A URL that loads.** Nothing counts before this.
2. **The asked-for thing, complete.** One finished journey beats three started ones.
3. **Honest failure states.** A reviewer will unplug something and watch. `/p/signal-board` shows the shape: it names the exact toggle to flip.
4. **Looking deliberate.** Free — the tokens and primitives already did it. Just do not fight them.
5. **Saying what you left out and why.** Reads as judgment. Silence reads as forgetting.

## What loses

- `localhost` at the end. Unforgivable and entirely avoidable.
- A spinner that never resolves, or an empty state shown after a failure.
- A table with no RLS. An interviewer who opens the dashboard has found your ceiling.
- A new dependency added at minute 70.
- Claiming something works without opening it.

---

## Skills

| Skill | When |
| --- | --- |
| **`/exercise-brief`** | Minute 0. Before code. |
| **`/new-prototype`** | Scaffold and build a prototype properly. |
| **`/design-research`** | A non-obvious layout. Mobbin references → this repo's tokens. |
| **`/ship`** | Get it live. Run it early and often. |
| **`/gate`** | Before any claim that something works. |
| **`/screen-review`** | Grade a screen against DESIGN.md §9. |
| **`/ponytail-review`** | The diff feels long. What can be deleted? |

## MCP servers

Configured in [`.mcp.json`](.mcp.json) — approve them on first use.

| Server | For |
| --- | --- |
| **supabase** | Migrations, `get_advisors`, type generation, logs, SQL. |
| **vercel** | Create the project, set env vars, read build logs. |
| **mobbin** | Real product references, via `/design-research`. |
| **figma** | Design file → code, when the exercise supplies one. |
| **chrome-devtools** / **playwright** | Drive and verify the running page. |

---

## Troubleshooting

**`node: command not found`** — Node is under fnm. `.claude/settings.json` puts it on `PATH` for tool calls; a bare shell needs `eval "$(fnm env)"`. If the fnm default version moved, update the `PATH` in `.claude/settings.json`.

**The board says anonymous sign-in is disabled** — Supabase dashboard → Authentication → Sign In / Providers → enable **Anonymous sign-ins**. Already set in `supabase/config.toml`, so `supabase config push` does it too once the CLI is logged in.

**`NEXT_PUBLIC_SUPABASE_*` missing** — `cp .env.example .env.local` and fill from the Supabase dashboard, or `get_publishable_keys` over MCP. Prototypes that do not touch the database keep working without this, by design.

**The Vercel build fails but the local build passes** — almost always a missing env var on Vercel, or a lockfile that was not committed.

**A `.select()` returns `null` and no error** — the column does not exist. PostgREST does that silently. Run `pnpm db:types` and check the name.
