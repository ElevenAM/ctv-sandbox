---
name: exercise-brief
description: Turn a technical-exercise prompt into a scoped, time-boxed plan before any code is written — the one journey, what is explicitly out of scope, the data shape, and the minute-by-minute sequence. Use at the START of a timed vibe-coding exercise, when handed an interview prompt or product brief, or when asked to "plan this", "scope this", or "what should I build first". Args: the exercise prompt, pasted or summarised.
---

# /exercise-brief <the prompt>

Converts a prompt into a plan you can execute without re-deciding anything. **Runs before code.** Ten minutes here is the difference between a finished prototype and three half-finished ones.

Output is a file at `docs/exercises/<slug>.md` plus a short chat summary. Use [`docs/templates/EXERCISE-BRIEF.md`](../../../docs/templates/EXERCISE-BRIEF.md).

## Procedure

1. **Restate the ask in one sentence.** "A ___ that lets ___ do ___." If you cannot, you do not understand it yet — the restatement is the deliverable of this step, not a formality.

2. **Name the ONE primary journey.** The single thing a grader will try first. Everything else is ranked below it and is cuttable. Write the ranked list; rank 1 is what ships no matter what happens to the clock.

3. **Write the out-of-scope list explicitly.** Three to six things you are deliberately not building: auth flows, settings, pagination, mobile-specific layouts, admin views. **Stating these is a feature** — it reads as judgment. Silently omitting them reads as forgetting.

4. **Pick the data shape** (ladder order from `/new-prototype`): client state → `prototype_state` → a new table. Default to the lowest rung that holds. A new table costs a migration, a types regen, and RLS; it is worth it for genuinely multiplayer or relational data and almost never otherwise.

5. **Identify the risk.** The one thing most likely to eat the clock — a realtime subscription, a drag interaction, an external API, a layout you have not built before. **Build a throwaway version of that first**, before the polish. Discovering at minute 50 that the hard part does not work is unrecoverable.

6. **Time-box it.** For a 90-minute exercise:

   | | |
   | --- | --- |
   | 0–10 | This brief. Scope, journey, out-of-scope, risk. |
   | 10–20 | Scaffold + migration if needed. **Deploy an empty shell and confirm the URL loads.** |
   | 20–55 | The primary journey, end to end, including the failed state. |
   | 55–70 | Ship and verify the deployed page. **The clock stops mattering once this is green.** |
   | 70–85 | Rank 2 if — and only if — rank 1 is genuinely complete. |
   | 85–90 | `/screen-review`, fix what is cheap, write the README section. |

   Deploying at minute 20 is the load-bearing move. It means that at every later moment you have something live, and a deploy failure surfaces while there is still time.

7. **State assumptions.** Anything ambiguous in the prompt, with the reading you chose. A grader reads these as judgment, not as hedging. Where two readings would produce materially different work and someone is available to ask — ask. Otherwise choose, write it down, and keep moving.

8. **Write the file, then say the plan in chat in under ten lines.** Do not wait for approval on a timed exercise unless the user asked to review the plan first — say what you are building and start.

## Invariants

- No code before the journey is ranked and the out-of-scope list is written.
- One primary journey. If the brief seems to have two, pick one and say why.
- The risky part gets a throwaway spike before anything gets polished.
- A deployed URL exists by the end of the first third of the clock, even if the page is nearly empty.
- Scope is cut from the bottom of the ranked list, never by leaving rank 1 half-done.
