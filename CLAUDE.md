# CLAUDE.md — ctv-sandbox working agreement

Operating manual for this repo. Conventions here **override** your defaults.

**This is not an application. It is a starter kit.** You are reading it because a session is about to build a prototype under time pressure — usually a vibe-coding technical exercise — and this repo exists so that session starts at minute 20 instead of minute 0. The infrastructure is already solved: Next.js, Supabase with real RLS, Vercel hosting, a design system, a prototype registry, MCP servers, and the skills below. **Your job is the exercise, never the scaffolding.**

The four load-bearing documents:

| File | Answers |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) (this file) | How we work. **Binding.** |
| [`DESIGN.md`](DESIGN.md) | How it looks and feels. **Binding — see rule 14.** |
| [`PLAYBOOK.md`](PLAYBOOK.md) | What to do in the first 10 minutes of a timed exercise. |
| [`docs/README.md`](docs/README.md) | Where every template and brief lives. |

---

## The one thing to get right

An interview is won by a **working, hosted, honest** prototype — not an ambitious broken one. In order of what actually scores:

1. **It loads at a URL you can paste into chat.** Nothing else counts until this is true.
2. **It does the one thing the brief asked for**, completely.
3. **It tells the truth when something fails** (rule 1) — an empty state that admits it is empty beats a spinner that lies.
4. **It looks deliberate** — that is what [`DESIGN.md`](DESIGN.md) and the tokens are for, and it costs you nothing because the work is already done.
5. Only then: extra features.

A half-built second feature is worth less than zero. It reads as "cannot finish."

---

## Repo map

```
src/
  app/               Next 16 App Router. layout + gallery + /p/[slug] host shell.
  components/ui/     The primitive set: Button, Tag, and the four data states.
  components/        Gallery (the catalogue grid).
  lib/               result.ts · env.ts · visitor.ts · color.ts · cn.ts · supabase/
  prototypes/
    registry.ts      THE catalogue. One line per prototype.
    types.ts         PrototypeMeta — the shape every meta.ts satisfies.
    <slug>/          meta.ts + Prototype.tsx. Self-contained. Delete it and
                     nothing else breaks.
supabase/migrations/ Numbered SQL. RLS on every table, no exceptions.
docs/                Templates, briefs, decisions. See docs/README.md.
scripts/             new-prototype.mjs (scaffold) · ci-local.sh (the gate) ·
                     check-rls.mjs (RLS negatives) · dev.sh (PATH bootstrap).
.claude/skills/      /exercise-brief · /new-prototype · /design-research ·
                     /ship · /gate · /screen-review · /ponytail-review
.mcp.json            Supabase · Vercel · Mobbin · Figma · Chrome · Playwright.
```

**A prototype is a folder.** `src/prototypes/<slug>/` plus one line in `registry.ts` is the entire contract. It gets a URL at `/p/<slug>` and a card in the gallery for free. Never edit the app shell to add a prototype.

## Commands

- **The gate: `pnpm gate`** — typecheck + lint + build, in that order. This is CI. Run it before you claim anything works and before every push.
- `pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm build` · `pnpm test`
- **`pnpm new <slug>`** — scaffolds a prototype and registers it. Always use this; it assigns the next index code and writes the registry line correctly.
- **`pnpm check:rls`** — ten two-anon-client negatives against the live project, proving the database refuses what the UI declines to offer. Run after any migration that touches a policy. Not in `pnpm gate` because it needs the network.
- `pnpm db:types` — regenerate `src/lib/supabase/database.types.ts` after **every** migration (rule 12).
- Node comes from fnm. `.claude/settings.json` puts it on `PATH` for tool calls; a bare shell needs `eval "$(fnm env)"` first.

## Platform

| | |
| --- | --- |
| Supabase | project `ctv-sandbox`, ref `thibkcpuvbskzznconzg`, ca-central-1 |
| Vercel | team `elevenams-projects-85623585` (hobby) |
| Git | `github.com/ElevenAM/ctv-sandbox`, branch `main` |

**Standing authorization**: reads against the `ctv-sandbox` Supabase project (SELECT, `list_tables`, `get_advisors`, `query_logs`, type generation) and writes (`apply_migration`, edge function deploys) are pre-authorized for the main session — it is a disposable sandbox. Subagents stay read-only unless their prompt grants more. **Never** touch `tcgsellerguilds-prod`, `tcgsellerguilds-staging`, or `DoTheseNow`; those are real projects in the same account.

---

## Hard conventions

### Errors & honesty
1. **Never silent.** Every failed operation sets user-visible state **and** logs. A `catch` that swallows is a bug. In an interview this is the single highest-scoring habit, because the reviewer will unplug something and watch.
2. **`console.error` for real failures, `console.warn` for degraded-but-working.** A network or permission failure is an error even when a retry rescues it.
3. **Async operations that can fail return `Result<T>`** from [`src/lib/result.ts`](src/lib/result.ts) — `{ ok: true, value } | { ok: false, reason }`. Callers branch on `.ok`. A failure must never be mistaken for an empty success. On failure, leave the UI so the user can retry, and **put their input back** — see the rollback in `signal-board`.
4. **Never render a `reason` to a user.** Map it to human copy at the boundary; send the raw string to `console.error`. `reason` is for you, copy is for them.

### React
5. **`useEffect` cleanups must not read state.** If a cleanup needs state, make it unmount-only (`deps: []`). Stale-closure cleanups are a shipped-bug generator.
6. **A ref that mirrors state is assigned in the same place as the setter**, never from an effect. The frame of delay reopens the race the ref exists to close.
7. **Every `await` in an effect needs a cancellation guard.** The component can unmount mid-flight; setting state afterwards leaks. Copy the `isCurrent` pattern in [`signal-board/Prototype.tsx`](src/prototypes/signal-board/Prototype.tsx).
8. **Prefer the server.** If data can be read in a Server Component and passed down, do that — it deletes a loading state, a failed state, and a waterfall. Reach for a client fetch only when the browser is genuinely required (anonymous auth, realtime, anything touching `window`).

### Supabase
9. **Every table ships RLS in the same migration that creates it.** No exceptions, not even "it's just a demo" — an interviewer who opens the dashboard and finds an unprotected table has found your ceiling. Write the four verbs as four policies, not one `FOR ALL`.
10. **`with check` is what stops forged ownership.** `using` filters what you can see; `with check` validates what you write. An insert policy without it lets a client post as somebody else.
11. **Verify `.select()` columns against `database.types.ts`.** PostgREST returns `null` data — not an error — for a column that does not exist, so a typo ships silently.
12. **Every migration regenerates the types in the same commit** (`pnpm db:types`). Drift between `supabase/migrations/` and `database.types.ts` is how rule 11 bites.
13. **`get_advisors` must come back clean** after a migration. A new `WARN` is a blocking regression, not a note for later.

### Design
14. **[`DESIGN.md`](DESIGN.md) is binding** for colour, type, motion, component form, the four data states, and error presentation. It outranks surrounding precedent: "the file next door does it differently" is a bug in that file, not permission. The four most-violated rules, restated because they are the ones that decide whether work looks deliberate:
    - **Never write a raw hex or a bare `text-[17px]`.** Spend a token or a `.type-*` role. A new value is a DESIGN.md change, not a one-off.
    - **Four distinct states on every list and detail surface: loading ≠ empty ≠ filtered-empty ≠ failed.** Import them from [`primitives.tsx`](src/components/ui/primitives.tsx). Rendering the new-user empty state during a load, or after a failure, is a bug.
    - **One primary action per screen**, and it is the only `brand` fill on it.
    - **Every tap is acknowledged within one frame** — a press state, or an optimistic update.
15. **Recoverable failures render in place with a Retry.** A blocking modal is for destructive confirmation only.

---

## Code shape — the ponytail ladder

**Before writing code, climb the ladder and stop at the first rung that holds.** The best code is the code never written. Climb *after* you understand the problem, not instead of understanding it — the shortest diff in the wrong place is a second bug.

1. **Does it need to exist?** Speculative "for later" scaffolding, unused flexibility → skip it and say so in one line. (This never applies to what the exercise actually asked for.)
2. **Is it already in this repo?** A `lib/` helper, a primitive, an existing migration shape, a pattern in another prototype. Look before you write — re-implementing what sits three files over is the most common slop.
3. **Stdlib?** `Map`, `Set`, `Intl`, `URL`, `structuredClone`, `crypto.randomUUID`, `toSorted`; in Postgres, `UNIQUE` / `CHECK` / `EXCLUDE` / `jsonb`.
4. **Platform?** HTML and CSS before a package — `<dialog>`, `<details>`, `<input type="date|range|color">`, native validation, CSS grid. In the database: a constraint or an RLS policy beats the same invariant re-checked in app code.
5. **An already-installed dependency?** Use it. Never add a package for what ten lines do. **In an interview, every new dependency is a risk you are taking with the clock.**
6. **One line?** One line.
7. **Only then:** the minimum that works. Fewest files, deletion over addition, boring over clever. No unrequested interface, factory, or config. No abstraction with one caller.

**Never lazy about:** understanding the problem · RLS and anything at a trust boundary (rules 9–13) · error handling that prevents data loss (rules 1–4) · accessibility and DESIGN.md (rules 14–15) · anything explicitly requested. A small diff that drops one of these is a bug, not a shrink.

**Deliberate corners** get a comment naming the ceiling: `// ponytail: O(n) scan, index it past ~1k rows`. Never use that comment to skip a never-lazy item.

**Ponytail governs the diff, not the conversation.** Keep the explanation short; keep the code shorter.

---

## Known exceptions

The complete list of sanctioned rule waivers. Adding one requires the same standard of justification — a paragraph at the call site explaining why the rule does not apply.

- **`react-hooks/set-state-in-effect` in [`signal-board/Prototype.tsx`](src/prototypes/signal-board/Prototype.tsx).** The rule traces `load` statically and cannot see that every `setState` sits behind an `await`, so it reads a guarded mount-fetch as a cascading render. Anonymous auth must happen in the browser, so this read cannot move to the server (rule 8). The cancellation guard from rule 7 is present.

---

## Definition of done

A prototype is done when **all** of these hold:

- [ ] `pnpm gate` passes (typecheck, lint, build).
- [ ] It is **live at a URL** and you have opened that URL yourself.
- [ ] All four data states are reachable, and you have seen the failed one — unplug the network or flip the env var and look.
- [ ] Every table it added has RLS, `get_advisors` is clean, and `pnpm check:rls` passes.
- [ ] `database.types.ts` matches the migrations.
- [ ] It has a brief in `docs/prototypes/<slug>.md` (`/exercise-brief` writes one).
- [ ] The landed diff sits on the highest ladder rung that holds.

**Never claim something works because it compiles.** Open it. If you could not open it, say which part is unverified — an honest "the realtime path is untested, here is how I would test it" outscores a confident claim that falls over on the first click.
