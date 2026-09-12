# Claim Edit Lab

**Route:** `/p/claim-edit-lab` · **Last verified:** 2026-09-12 · **Method:** browser (deployed page at https://ctv-sandbox.vercel.app/p/claim-edit-lab and the dev server)

## Ranked journeys
1. Write a rule and see, instantly, which sample claims it flags and what it would have saved.
2. Hand the rule to engineering as a spec (Copy as spec, with the spec always visible underneath).
3. Understand why a given line was flagged.

## Grades (DESIGN.md §9)
Closed set: PASS / FAIL / NOT GRADED. Never "partial".

| Q | Question | Grade | Evidence |
| --- | --- | --- | --- |
| 1 | Glance test | PASS | Deployed page at 1440px, no rule loaded: headline, two example buttons, an empty condition list, three stat tiles, and an empty state that says what to do. Matches `meta.ts` summary. Caveat: graded by the author of the code; a stranger's glance is the real test. |
| 2 | Four data states reachable and distinct | PASS | Empty (no conditions, `Prototype.tsx:232`), failed (only unusable conditions, `:237`), filtered-empty (valid rule, zero matches, `:242`) all reached in the browser on 2026-09-12. **Loading does not exist**: nothing is fetched, the sample is a static module. The failed state is an unevaluable rule, not a network failure; see Decisions. |
| 3 | Rent audit — every element serves a journey | PASS | No exceptions. See below. |
| 4 | Ergonomics — 44px floor, focus, keyboard | PASS | After the two fixes below. Controls are `min-h-11` (`Prototype.tsx:40`, Button primitive). Tabbed through the whole page on the deployed build: every stop reported `:focus-visible` with a 2px outline. Row controls verified on the dev server after the fix. |
| 5 | One primary action | PASS | One `brand` fill: Copy as spec (`Prototype.tsx:190`). Radios and the checkbox use the brand token as `accent-color`, the platform's selected-state colour, not a fill; same as token-lab's sliders. |
| 6 | Both themes, 375px and 1440px | PASS | Four combinations screenshotted in the Browser pane on 2026-09-12 (not saved to disk, the pane cannot write files). `scrollWidth === clientWidth` at 375px in both themes. Wide table scrolls inside its own container (`Prototype.tsx:391`). |

## Rent audit
Above the fold at 1440px: page shell (header, breadcrumb, title, summary, tags), example buttons (journey 1), condition list and Add condition (1), action radios (1), Copy as spec (2), "What engineering receives" (2, the fallback when the clipboard is refused), "This rule is not saved" (honesty, DESIGN §6), three stat tiles (1), caveat line under the tiles (1, keeps the number defensible), results area (1, 3).

No element serves no journey. Nothing to demote, merge, or remove.

## Findings
Append-only. Check off with the commit that fixed it; never delete.

- [x] `2026-09-12` **sev-med** — Form controls carried `focus:outline-none`, which removed the global focus ring, so keyboard focus on every select and number input was invisible. Fixed the same day by dropping the class from `CONTROL` (`Prototype.tsx:40`); verified the ring on the Field select. The same pattern exists in `signal-board/Prototype.tsx` and is flagged as a separate task.
- [x] `2026-09-12` **sev-low** — The "Remove condition" button measured 32×44px, under the 44px width floor (`Prototype.tsx:321`). Fixed the same day with `min-w-11`.
- [x] `2026-09-12` **sev-med** — At 375px the condition row overflowed the viewport by 16px because the value input sat in an `auto` grid column. Fixed the same day: operator and value span the row below 640px (`Prototype.tsx:298`).
- [x] `2026-09-12` **sev-low** — At desktop widths the three row controls were 153 / 115 / 26px because `1fr` tracks would not shrink below a select's widest option. Fixed with `minmax(0,1fr)` tracks and `min-w-0` on controls.

## Decisions
- **No loading state, and the failed state is an unevaluable rule.** The sample is a seeded module so the savings number is identical on every load and deploy. Nothing is fetched, so there is nothing to wait for or to fail on the network. The PRD names fetching the sample as the cut rank 3.
- **"Why" tags are the rule's conditions, not per-line evidence.** With a flat AND list every flagged line matched every condition, so the two are identical. They diverge only if OR groups are added.
- **Screenshots are not on disk.** The Browser pane returns images inline and cannot save them; evidence here is file:line plus the dated browser session.
