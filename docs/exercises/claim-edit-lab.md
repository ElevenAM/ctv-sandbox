# Claim Edit Lab — PRD and 30-minute brief

**Date:** 2026-09-12 · **Time box:** 30 min · **Prototype:** `/p/claim-edit-lab`

## The ask, in one sentence
A page that lets a policy analyst write a claim-edit rule themselves and instantly see which claims in a sample set it would flag, and what it would have saved.

## The problem, in plain words
Today the analyst knows *what* the rule should be but cannot express it in a way the system can run. So they write it in a spreadsheet, email it to engineering, and wait six weeks while someone translates it into code, tests it, and ships it. Nobody sees whether the rule was any good until it is live. Both the six weeks and the blind bet are the problem. The fix is to let the analyst express the rule in a form the system runs directly, and show the consequences before anyone commits.

## Decisions taken (2026-09-12, with the user)
| Decision | Chosen | Why |
| --- | --- | --- |
| Domain | Healthcare claims with **plain-English service names** instead of CPT codes | Keeps the industry framing (units, modifiers, place of service) but a non-clinical reviewer can follow the demo without a code lookup |
| Rule power | **Flat AND list** of conditions on one claim line | Covers unit caps, missing-modifier, age, place-of-service edits. Instant to evaluate, easy to explain why a line was flagged |
| Savings math | **Deny line** or **Cap units at N** | Deny saves the whole paid amount; cap saves only the excess units. Two formulas, both defensible |
| Deliverable | **30-minute build** in this repo | One journey, everything else cut |

## Ranked journeys
Rank 1 ships no matter what happens to the clock.

1. **Type a rule, see who it catches and what it saves, instantly.** Think of it as a filter on a spreadsheet, with a price tag.
   - The analyst writes the rule as a sentence made of drop-downs. Each line is one test: pick a thing to look at ("units"), a comparison ("more than"), and a value ("4"). A claim is flagged only if it passes every line.
   - They say what happens to a flagged claim: "don't pay this line at all" or "only pay up to N units".
   - The page answers immediately. Change anything in the rule and the sample re-checks itself: flagged rows light up, and a number at the top says how many were caught and how many dollars that adds up to. No submit button, no waiting.
   - Every flag explains itself. Click a flagged claim and it shows which lines of the rule it failed, so a good catch is easy to tell from a bad one.
   - Two ready-made rules are one click away: "Physical therapy over 4 units" and "Telehealth visit billed at the office". A reviewer clicks one and sees the whole payoff without building anything.
2. **Copy the rule as a spec.** A "Copy as spec" button puts a plain-English sentence plus the rule's JSON on the clipboard. This is the artifact that replaces the emailed spreadsheet.
3. Load the sample by `fetch` so a real failed state exists (see Risks, item 6).

## Explicitly out of scope
- **Pair edits** ("code A billed with code B") and **history edits** ("same member within 30 days"). Real and valuable, but each is a second evaluation model and a second form. Named in the UI as "not in this version".
- **OR groups.** A flat AND list already proves the authoring idea.
- **Saving rules, users, approval workflow.** The rule lives in the page. Refresh loses it, and the page says so.
- **Real claim data.** The sample is synthetic and labelled synthetic on screen.
- **Annualising savings.** The figure is "on this sample of N lines", never "per year".
- **Mobile-specific layout.** Checked at 375px only for nothing breaking.

## The rule model
```
Rule = { conditions: Condition[], action: { kind: 'deny' } | { kind: 'cap'; maxUnits: number } }
Condition = { field, operator, value }
```
Fields on a claim line and the operators each allows:

| Field | Type | Operators |
| --- | --- | --- |
| service | enum (8 names) | is, is not |
| modifier | enum (none, telehealth, bilateral, separate service) | is, is not, is missing |
| placeOfService | enum (office, hospital outpatient, telehealth, emergency) | is, is not |
| diagnosis | enum (back pain, flu, diabetes, knee injury, routine) | is, is not |
| units | number | greater than, less than |
| memberAge | number | greater than, less than |
| memberSex | enum (F, M) | is |
| paid | number (dollars) | greater than |

A line matches when **every** condition is true. Zero conditions means nothing is evaluated and the page shows the empty state, not "everything flagged".

## Savings math, exactly
- **Deny:** savings on a flagged line = `paid`.
- **Cap units at N:** only lines with `units > N` are flagged. Savings = `paid × (units − N) / units`. Assumes every unit was paid the same, which is stated under the number.
- Summary tile shows: lines flagged / lines in sample, dollars flagged / dollars paid in sample, and the label **"Estimated gross savings on this sample. Before appeals."**
- If more than 25% of lines match, a warning appears in place: "This rule flags one line in four. Broad rules cause provider disputes; consider tightening it."

## Data shape
`client state` with the sample as a **TypeScript module** (`sample.ts`) of about 150 claim lines generated by a seeded pseudo-random function at module load. Seeded, not `Math.random`, so the savings number is identical on every reload and every deploy; a demo figure that drifts reads as broken. Planted patterns so the preset rules produce hits: physical therapy lines with 6–8 units, telehealth visits with place of service "office", MRI lines carrying a "routine" diagnosis. No table, no migration, no RLS surface added.

Claim line fields: `id, service, modifier, placeOfService, diagnosis, units, memberAge, memberSex, billed, paid`.

## Screen layout
Two columns on desktop, stacked on mobile.
- **Left, the rule.** Condition rows (native `<select>` for field and operator; `<select>` or `<input type=number>` for value), an "Add condition" ghost button, an action radio (deny / cap at N), and the two preset chips. "Copy as spec" is the one `brand` fill on the page.
- **Right, the consequence.** Summary tile on top (flagged count, flagged dollars, hit rate). Below it the sample table, flagged rows highlighted with the accent tone and a "why" cell listing the conditions that matched. `<details>` per row for the full line.

The four states on the table: **loading** does not apply (nothing is fetched, see Risks 6); **empty** = no conditions yet ("Add a condition to see what this rule would flag"); **filtered-empty** = conditions present, zero matches ("No line in the sample matches. The rule is valid, it just would not have fired here."); **failed** = a condition with an unusable value, e.g. units greater than blank, rendered in place on that row, the table keeps showing the last good result.

## Riskiest part
The condition-row editor. Build it first as an ugly three-select row wired to `evaluate()` and confirm the table reacts, before any layout or the summary tile. If that works at minute 12, the rest is assembly.

## Risks and trade-offs, in plain words
1. **The savings number can over-promise.** In the real world some flagged claims get appealed and paid anyway, so "would have saved" is a ceiling, not a cheque. Mitigation: label it gross, show the hit rate beside it, never annualise.
2. **A rule that flags too much is a bad rule, not a good one.** Providers push back, and the plan spends the savings on dispute handling. Mitigation: the 25% warning. It costs three lines and reads as judgment.
3. **Flat AND cannot express the two most valuable real edit types** (code pairs, history). Trade: half the build time for a rule builder a grader can understand in ten seconds. The UI names the gap.
4. **Synthetic data proves the mechanism, not the money.** Anyone who has seen real claims will know. Say "synthetic sample of 150 lines" on screen rather than hoping nobody asks.
5. **No persistence.** A refresh loses the rule. In 30 minutes a saved-rules table with RLS is not affordable, and the page says "this rule is not saved" so the loss is never a surprise.
6. **No fetch means no reachable failed data state.** CLAUDE.md wants the failed state seen; here nothing can fail on the network. Trade: five minutes of clock and one more state versus a page that cannot break. Chosen: keep it static, make invalid-rule the honest failure surface, and offer rank 3 if time remains.
7. **The clock.** Thirty minutes is enough for one journey only. Rank 2 exists because it is a 5-minute button, not because it is safe.

## Assumptions
- The prompt's "claim edits" means pre-payment claim edits at a health plan, not provider-side billing scrubbers. Reading it that way because "what it would have saved" is a payer's question.
- "Sample set" is a fixed sample the analyst already trusts, not something they upload. Uploading a spreadsheet is a natural rank 4, and is not here.
- One analyst, one browser, no login. Nothing on the page belongs to anyone.

## Time box
| Minutes | |
| --- | --- |
| 0–3 | This brief |
| 3–7 | `pnpm new claim-edit-lab`, then `/ship` the empty shell and confirm the URL loads |
| 7–12 | Spike: `sample.ts`, `evaluate()`, one ugly condition row, table reacts |
| 12–20 | Rank 1 complete: action radio, presets, summary tile, four table states, why-cell, 25% warning |
| 20–25 | `/ship`, open the deployed URL, drive both presets and the filtered-empty and invalid states |
| 25–28 | Rank 2 (Copy as spec) only if rank 1 is finished |
| 28–30 | `/screen-review`, fix what is cheap, fill in Outcome below |

## Success criteria
- A URL that loads, with the preset chip producing a flagged table and a dollar figure in one click.
- Every change to the rule updates the table within one frame.
- Zero conditions shows empty, zero matches shows filtered-empty, a blank number shows an in-place error, and the last good result is never replaced by a wrong one.
- The savings label says "gross" and "on this sample".
- `pnpm gate` green.

## Sources consulted
- HealthEdge Source custom edits: point-and-click conditions on the current claim, historical claim, and relations between them. https://healthedge.com/resources/data-sheets/take-control-of-claims-editing-with-advanced-custom-edits-from-healthedge-source
- HealthEdge "monitor mode" and batch modelling: run an edit against production or history without affecting payment. https://healthedge.com/resources/data-sheets/better-insights-lead-to-better-decisions-for-claims-operations
- NCCI edit families (procedure pairs, unit limits, age and gender restrictions), which the field list above mirrors in plain English. https://www.aapc.com/blog/39871-know-the-difference-between-medicare-and-medicaid-ncci-edits/ · https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits/medicare-ncci-faq-library
- False positives and provider abrasion as the cost of over-broad edits. https://www.claritev.com/insights/rethinking-payment-integrity/ · https://www.healthcareittoday.com/2026/08/31/the-next-era-of-payment-integrity-is-prevention-not-recovery/
- Lyric Edit, for the "identified" versus realised savings framing (findings that "persist"). https://www.lyric.ai/solutions/edit
- Rule-builder UI pattern: one row per condition, all-must-match by default, live preview. https://ui-patterns.com/patterns/rule-builder
- CMS DE-SynPUF, the public synthetic claims files, considered and rejected as the sample because real codes contradict the "simplified codes" decision. https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-claims-synthetic-public-use-files/cms-2008-2010-data-entrepreneurs-synthetic-public-use-file-de-synpuf/de10-sample-1

## Outcome
Filled in at the end: what shipped, what was cut, what is unverified.
