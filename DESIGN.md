# DESIGN.md — binding design system

**Binding** (CLAUDE.md rule 14). This outranks surrounding precedent: if a component next door breaks a rule here, that component is wrong, not this file.

The implementation is [`src/app/globals.css`](src/app/globals.css) and [`src/components/ui/primitives.tsx`](src/components/ui/primitives.tsx). This document is the *why*, so a session can extend the system instead of guessing at it.

The point of all of this: **a prototype built under time pressure should still look like somebody decided.** Every rule below exists so you make zero visual micro-decisions during an exercise and still land something coherent.

---

## §1 Tokens — the only source of colour

Never write a raw hex, `rgb()`, or a Tailwind palette class (`bg-zinc-800`, `text-blue-500`). Spend a token.

**Surfaces**, back to front: `ground` → `surface` → `raised`, separated by `line` / `line-strong`.
`ground` is the page. `surface` is a card. `raised` is an input, a failed state, or a thing sitting on a card.

**Ink**, by emphasis: `ink` (primary) → `ink-soft` (secondary prose) → `ink-muted` (metadata, labels). **`ink-muted` is the floor.** Real copy never goes quieter.

**Accents**: `amber` `iris` `jade` `rose` `slate`. These five names are also the `CHECK` constraint on `board_note.tone` — the palette and the database agree on purpose. Adding a sixth means a migration.

**Brand**: `brand` + `brand-ink`. See §4.

Tokens are authored in **OKLCH** so perceived lightness stays put as hue moves — that is why the five accents read as one family. `/p/token-lab` is the live proof.

### Adding a token
Define it on bare `:root` **first**, then redefine it in both dark blocks. A colour that exists in only one theme is the bug that makes a page unreadable for half its visitors. Never introduce a token for the first time inside a `@media` or `[data-theme]` block.

### Theme
Three states: explicit `light`, explicit `dark`, and `system` (no attribute — `prefers-color-scheme` decides). `system` stays a real option; a two-state toggle silently overrides the OS forever. The pre-paint script in `layout.tsx` is what stops the flash — do not remove it.

---

## §2 Typography — roles, never sizes

Six roles. Spend one:

| Role | For |
| --- | --- |
| `.type-display` | The one headline on a page. Fluid. |
| `.type-title` | Section and prototype titles. |
| `.type-heading` | Card headings, state titles. |
| `.type-body` | Prose and controls. The default. |
| `.type-small` | Secondary copy, helper text. |
| `.type-index` | The catalogue voice — index codes, tags, metadata. Mono, uppercase, tracked. |

**Never write a bare `font-size` or `font-weight`.** If no role fits, the honest move is a DESIGN.md change adding one, not `text-[19px]` in a component.

`.type-index` is what gives the library its filing-cabinet character. Use it for anything that behaves like a label, and nowhere else.

---

## §3 The four data states

**Every list and every detail surface implements four distinct states.** They are not interchangeable:

| State | Means | Component |
| --- | --- | --- |
| **Loading** | We do not know yet. | `<LoadingState />` |
| **Empty** | We know, and there is genuinely nothing. | `<EmptyState />` |
| **Filtered-empty** | There is data; *this filter* excludes it. | `<FilteredEmptyState />` |
| **Failed** | We tried and could not find out. | `<FailedState />` |

Rendering the new-user empty state during a load — or after a failure — is a bug. It tells someone with 3,000 rows that they have none.

**Failed is the one that gets skipped, and the one an interviewer will look for.** Build it first if you build any of them first. Include an operator hint when the fix is a known one-liner; `signal-board` prints the exact Supabase toggle to flip.

A skeleton pulses (`.shimmer`) and never masquerades as content.

---

## §4 One primary action

**One primary action per screen, and it is the only `brand` fill on it.** Two primaries means neither is. Everything else is `secondary`, `ghost`, or `danger`.

`brand` fill is reserved for that one action. It is not a decoration, not a hover, not an accent bar — use a tone accent for those.

---

## §5 Motion and feedback

- **Every tap is acknowledged within one frame** — a press state (`active:scale-[0.98]`) or an optimistic update. A control that looks inert for 300ms reads as broken.
- Three durations: `fast` (120ms, press feedback), `base` (200ms, hover and colour), `slow` (380ms, entrances). Longer than `slow` reads as lag, not polish.
- One easing: `--ease-out-soft`. Do not introduce a second curve.
- **`prefers-reduced-motion` is honoured globally** in `globals.css`. Motion is never the only signal that something happened.

---

## §6 Errors in the interface

- **Recoverable failure renders in place, with a Retry.** Never a blocking modal. Modals are for destructive confirmation only.
- **Never render a `Result.reason`.** Map it to human copy at the boundary; the raw string goes to `console.error` (CLAUDE.md rule 4).
- Error copy says **what happened, and what is true now** — "That note did not save. Nothing was lost — press Post to try again." The second sentence is the one that matters: it tells them their work still exists.
- Put returned input **back in the field**. Losing someone's typing is the worst thing a prototype can do.

---

## §7 Ergonomics

- **Interactive controls are at least 44×44px.** `min-h-11` on `Button` is a floor, not a default — shrinking it needs a reason.
- Adjacent controls get at least 8px between them.
- A destructive control never sits beside the primary action.
- **Focus is always visible.** `:focus-visible` is styled globally; removing an outline for looks is not a trade that is available.
- Every icon-only control has an `aria-label`. Every form control has a real `<label>` or `aria-label`.
- Wide content (tables, code, diagrams) scrolls inside its own container. The page body never scrolls horizontally.

---

## §8 Layout

- Content maxes out at `max-w-6xl`; prose at `max-w-prose`. A 1,400px-wide paragraph is unreadable regardless of how good the type is.
- Mobile first. Every surface is checked at 375px before it is called done.
- The page shell (header, footer, skip link) lives in `layout.tsx`. **A prototype never renders its own chrome** — it gets the shell for free and stays a single component.

---

## §9 Review rubric

Grade against this before calling a screen done. Each is PASS / FAIL / NOT GRADED — never "partial".

1. **Glance test.** Show someone the screen with no context. Can they name the main thing it is for? If not, the hierarchy is wrong — not the copy.
2. **Four states.** Reach all four. Actually reach them: throttle the network, break the env var, apply a filter that matches nothing.
3. **Rent audit.** List every element above the fold. Which journey does each serve? An element that serves none is paying no rent — demote, merge, or remove it. "Keep and watch" is not a verdict.
4. **Ergonomics.** Measure the controls. Tab through the whole screen with the keyboard only.
5. **One primary.** Count the `brand` fills. The answer is one.
6. **Both themes, 375px and 1440px.** Four combinations, all legible.

`/screen-review <route>` walks this rubric and writes the result into a screen guide.
