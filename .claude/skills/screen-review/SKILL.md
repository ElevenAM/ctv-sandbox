---
name: screen-review
description: Grade one prototype screen against the DESIGN.md §9 rubric — glance test, four data states, rent audit, ergonomics, one-primary, both themes — driving the real page in a browser, then write the result into docs/screens/. Use when asked to review a screen, grade the UX, check a design, or before demoing a prototype to anyone. Args: a route or slug (e.g. "signal-board", "/p/token-lab").
---

# /screen-review <route>

Grades ONE screen against [`DESIGN.md`](../../../DESIGN.md) §9. The deliverable is an updated guide file in `docs/screens/`, not prose in chat.

Grades come from a **closed set**: `PASS` / `FAIL` / `NOT GRADED`. "Partial" is banned — it is how a FAIL gets laundered into a shrug.

## Procedure

1. **Resolve the target.** Accept a bare slug, a `/p/...` path, or a file path. Find its guide in `docs/screens/<slug>.md`; if there is none, copy `docs/templates/SCREEN-GUIDE.md` and fill the header.

2. **Look before you read.** Order is load-bearing — the glance test dies the moment you read the implementation.
   - Start the page (`preview_start`, or `pnpm dev` then navigate) and take a screenshot.
   - **Q1 glance test.** Before opening any source file, write down: what is this screen for, and what are the top three things someone would come here to do? Then compare against the prototype's stated `summary` in `meta.ts`. A mismatch is a hierarchy problem, not a copy problem.

3. **Q2 — the four states.** *Reach* them; do not reason about them.
   - **Loading**: throttle the network in the browser, or reload and screenshot early.
   - **Empty**: clear the data, or point at an empty filter.
   - **Filtered-empty**: apply a filter that matches nothing. Confirm it is visibly *different* from empty.
   - **Failed**: break it on purpose — bad env var, offline, or a refused write.
   - Any state you could not reach is `NOT GRADED` with the reason named. A state that renders the wrong sibling (empty shown during a load) is `FAIL`.

4. **Only now read the code.** Verify what you saw: the state branches, the `Result` handling, whether `reason` leaks into the UI, whether tokens or raw values are used.

5. **Q3 rent audit.** List every element above the fold. Tag each with the journey it serves. Record **exceptions only** — anything serving no journey gets a verdict: demote, merge, or remove. "Keep and watch" is not a verdict.

6. **Q4 ergonomics.** Measure interactive controls from the code (height + padding); flag anything under 44×44px, gaps under 8px, or a destructive control beside the primary. Then **tab through the entire screen with the keyboard only** and confirm focus is visible at every stop.

7. **Q5 one primary.** Count `brand` fills. The answer is one. More than one is `FAIL`.

8. **Q6 themes and widths.** Screenshot all four combinations: light/dark × 375px/1440px. Check contrast on any tone-coloured text, and that nothing scrolls horizontally.

9. **Write the guide.** Update `docs/screens/<slug>.md`: grades, dated findings, `last-verified`. **Findings accumulate** — never delete one, only check it off with the commit that fixed it.

10. **Report** in chat: the grade per question, new findings, and what you could not verify. Under 15 lines; the guide diff is the deliverable.

## Invariants

- Screenshot and glance-grade **before** reading the implementation. Never grade from memory of code you just wrote.
- Every claim carries a file:line, a screenshot, or the explicit word `unverified`.
- The four data states, the type scale, and the 44px floor are DESIGN.md — never flag them as clutter in the rent audit. Extra chrome serving no journey is what the audit is for.
- Findings are append-only. Grades are from the closed set.
