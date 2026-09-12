# Token Lab (EX-02)

**Status:** live · **Updated:** 2026-09-11 · **Route:** `/p/token-lab`

## What it is
A live editor for the design system. Drag lightness, chroma, hue, or corner radius and every component in the preview panel re-themes instantly. Each colour pairing is scored against WCAG contrast as you move it.

## Why it exists
Two jobs.

**It proves the claim in DESIGN.md §1** — that nothing in this library hard-codes a colour. The controls write CSS custom properties onto a single wrapper element; the components inside change because a token is the only place any of them reads from. If someone had written `bg-zinc-800` anywhere in the primitive set, this page would visibly fail to retheme it. It is a design-system test you can look at.

**It is the no-database reference pattern.** Zero network, zero failure modes, instant load. When an exercise does not need persistence, this is the shape — `capabilities: []` and nothing to go wrong.

## How it works
All state is local. `themeStyle` builds a `CSSProperties` object of `--ctv-*` overrides; the surfaces (`surface`, `raised`, `line`) are derived from the ground's lightness rather than chosen, so the scale stays coherent at any setting.

Ink is **derived, not chosen** — it flips to whichever end of the scale actually reads on the current ground. A theme editor that lets you ship 2:1 body text is a toy.

`src/lib/color.ts` does OKLCH → sRGB and WCAG contrast in about forty lines, because tokens are authored in OKLCH (for stable perceived lightness across hue) while WCAG is defined on sRGB relative luminance. No dependency (ponytail rung 6).

## Known ceilings
- **Out-of-gamut colours are clamped, not gamut-mapped.** At high chroma the swatch and the real rendering can diverge slightly. Correct fix is a chroma-reduction search; overkill here.
- **Edits are not persisted.** Reload and you are back to Sandbox. `prototype_state` (migration 0001) is the intended home if that ever matters.
- **Only brand and ground are editable.** The five accents are fixed, because they are also a `CHECK` constraint on `board_note.tone` — changing them is a migration.
- **The preview is not the whole library.** It covers the primitive set; a prototype that invented its own component is not represented, which is itself the point.
