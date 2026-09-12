---
name: design-research
description: Ground a UI in real shipped products before building it — search Mobbin for the screen, flow, or section being built, extract the concrete layout decisions, and translate them into this repo's tokens and primitives. Use when starting any non-obvious surface, when asked "how should this look", "find references", "what do other apps do", or when a layout decision is being made on instinct rather than evidence.
---

# /design-research <what you are building>

Ten minutes of looking at what shipped beats an hour of inventing. This skill turns real products into concrete decisions for the surface at hand.

Uses the **Mobbin** MCP (`search_screens`, `search_flows`, `search_sections`). Always cite what you used.

## Procedure

1. **Say what you are building in one sentence** — the UI elements and how they relate. That sentence is your query. Mobbin rewards specificity and punishes keyword soup.
   - Good: `"checkout page with promo code field and saved card selection"`, `"empty state for a collaborative board with an invite prompt"`
   - Bad: `"modern clean dashboard"`, `"good UI"`, `"board, cards, tags, filters"`
   - One screen per search. Searching two things at once returns neither.

2. **Pick the tool by shape:**
   - `search_screens` — one screen. Pass `platform: 'web'` for this repo (everything here is a web prototype).
   - `search_flows` — a multi-step journey (onboarding, checkout). Use when sequencing matters.
   - `search_sections` — a marketing or landing section (hero, pricing, footer).

3. **Actually look at the images.** Do not summarise from metadata — the whole value is in what was drawn. For each useful result, extract concretely:
   - What is above the fold, and in what order?
   - What is the one primary action, and how is it distinguished?
   - What is *absent*? The omissions are the decisions. A shipped screen that does not have a filter bar is telling you something.
   - How is metadata treated — small, quiet, mono, uppercase?

4. **Translate into this repo's system, do not copy pixels.** A reference gives you *structure*; the tokens give you the look. Write the decision as: "Taking the ___ from ___, implemented as ___."
   - Their accent colour → a tone token. Their type sizes → a `.type-*` role. Their card → `surface` + `line` + `--radius-card`.
   - **Never introduce a hex, a font size, or a shadow from a reference.** That is how a prototype stops looking like it belongs here.

5. **Cite every screen you mention** as a markdown link to its `mobbin_url`, so the decision is auditable later.

6. **Record it.** If the decision is load-bearing, add it to the prototype's brief under a `## Design references` heading, or to `docs/decisions/` if it changes the shared system.

## Invariants

- Look at the images before describing them.
- Structure is what you borrow. Colour, type, and spacing come from the tokens — always.
- Cite with `mobbin_url` links.
- Timebox to ten minutes in an exercise. This is input to a decision, not a substitute for making one. If two searches have not produced a direction, pick the most conventional layout and build — a conventional screen that works beats a researched one that does not exist.
