# Claim Edit Lab (EX-03)

**Status:** live · **Updated:** 2026-09-12 · **Route:** `/p/claim-edit-lab` · **PRD:** [`docs/exercises/claim-edit-lab.md`](../exercises/claim-edit-lab.md)

## What it is
A policy analyst writes a claim-edit rule as a sentence of drop-downs ("Service is Physical therapy AND Units more than 4, then pay at most 4 units") and a synthetic sample of 150 claim lines answers on every change: how many lines it flags, why each one matched, and the gross dollars it would have saved. Two example rules get a reviewer to the payoff in one click. "Copy as spec" puts a plain-English sentence plus the rule's JSON on the clipboard, which is the artifact that replaces the spreadsheet emailed to engineering.

## Why it exists
The prompt: today an analyst emails a spreadsheet of proposed edits to engineering and it ships six weeks later. This proves the analyst can express the rule in a form the system runs directly, and see the consequences before anyone commits. It is also the repo's reference for a **pure evaluation model** kept out of React (`rules.ts`) and a **seeded synthetic sample** (`sample.ts`) so a demo number never drifts between reloads or deploys.

## How it works
Client state only, the lowest rung that holds. Nothing is fetched and no table was added. `evaluate(rule, SAMPLE)` runs in a `useMemo` on every keystroke; it skips conditions that cannot be evaluated (a blank number) rather than failing the whole rule, so the table keeps showing the last good result while the analyst types.

Savings: **deny** saves the line's paid amount; **cap at N** flags only lines with more than N units and saves `paid × (units − N) / units`, which assumes every unit was paid the same, and the page says so. The figure is labelled gross, on this sample, before appeals, never annualised. A rule that flags more than a quarter of the sample gets an in-place warning about provider disputes.

States on the results surface: **empty** (no conditions), **failed** (only unusable conditions), **filtered-empty** (valid rule, zero matches), and the table. **Loading does not apply** because nothing is fetched; the honest failure surface is the invalid condition, rendered on its own row. `FilteredEmptyState` gained optional `title`, `body`, and `clearLabel` props for this, because its default copy is about the library.

## Verified
`2026-09-12`, in a browser against the dev server:
- "Physical therapy over 4 units" flags 13 / 150 lines, $984, with the cap assumption line shown.
- "Telehealth visit billed at the office" flags 8 / 150 with deny.
- Changing the place to "emergency" renders the filtered-empty state; switching a field to Units with a blank value renders the in-row "Needs a number" error and skips that condition.
- Zero console errors.
- Deployed URL: see the Outcome section of the PRD.

## Known ceilings
- **Flat AND only.** No OR groups, no code-pair edits, no member-history edits. Those are the two most valuable real edit families; each is a second evaluation model and a second form.
- **The rule is not saved.** Refresh clears it. The page says so. A saved-rules table with RLS is the obvious next rung.
- **Synthetic sample, labelled synthetic.** It proves the mechanism, not the money. Uploading a real extract is the natural next step.
- **"Why" shows the rule's conditions, not per-line evidence.** With a flat AND list every flagged line matched every condition, so the two are the same; they would diverge with OR groups.
- **Clipboard can be refused** in some embeds. The spec is always visible under "What engineering receives" so nothing is lost.
