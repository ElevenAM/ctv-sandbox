---
name: ponytail-review
description: Review the current diff for over-engineering only — what can be deleted. Finds reinvented stdlib, unnecessary dependencies, speculative abstractions, custom widgets where HTML or Postgres already holds, and wrappers with one caller. Use when asked to "simplify this", "what can we delete", "is this over-engineered", "ponytail review", or before committing a large diff. Read-only; reports findings, does not edit.
---

# /ponytail-review

Read-only. Reviews the **current diff** (or the named files) for unnecessary complexity. The diff's best outcome is getting shorter.

Correctness bugs, security holes, and performance are **out of scope** — route those to a normal review. This pass hunts complexity only. Bound by [`CLAUDE.md`](../../../CLAUDE.md) §Code shape.

## Scope

Default: `git diff` against `main` plus uncommitted changes. If the user names files or a SHA range, use that instead. Do not scan the rest of the repo — that is a different ask.

## Tags

One line per finding, each tagged:

- **`delete`** — the code has no caller, no reader, and no requirement behind it.
- **`stdlib`** — reimplements `Map` / `Set` / `Intl` / `URL` / `structuredClone` / `toSorted` / `crypto.randomUUID`, or in SQL a `UNIQUE` / `CHECK` / `jsonb` operator.
- **`platform`** — a package or custom widget where HTML, CSS, or Postgres already holds: `<dialog>`, `<details>`, `<input type="date|range|color">`, native validation, CSS grid; a constraint or RLS policy instead of the same invariant re-checked in app code.
- **`reuse`** — already exists in this repo. A `lib/` helper, a primitive, a state component, the policy shape in migration 0002.
- **`yagni`** — speculative flexibility, a config nobody sets, an abstraction with one caller, an interface nobody implements twice.
- **`shrink`** — correct but longer than it needs to be.

## What is NOT a finding

Say this out loud when tempted — a review that strips these has made the code worse:

- The four data states, `.type-*` roles, tokens, the 44px floor, focus styles, `aria-label`s. That is DESIGN.md, not bloat.
- `Result<T>` handling, error branches, `console.error` calls, cancellation guards. That is CLAUDE.md rules 1–7.
- RLS policies — including the "redundant-looking" fourth one. Four explicit policies beat one `FOR ALL` on purpose.
- Comments explaining *why*. Delete comments that restate *what* the line does; keep the ones that record a decision.
- Anything the user explicitly asked for. You may note a simpler alternative; you may not call the request itself over-engineering.

## Output

```
<tag>  <file>:<line>  — <what to do, in one line>
```

Most-deletable first. End with the net line count the findings would remove. If the diff is already at the right rung, say so in one line and stop — a review that manufactures findings to look thorough is worse than no review.
