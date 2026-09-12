# One Next.js app hosts every prototype, rather than one app per prototype

**Date:** 2026-09-11 · **Status:** accepted

## Context
The repo has to make a prototype hostable in minutes, repeatedly, for unrelated exercises. The obvious alternative was a monorepo where each prototype is its own deployable app.

## Decision
A single Next.js app. A prototype is a folder under `src/prototypes/<slug>/` plus one line in `registry.ts`; it gets `/p/<slug>` and a gallery card for free. `pnpm new` writes both.

## Alternatives considered
- **Monorepo, one app per prototype** — N Vercel projects, N sets of env vars, N build configs, N cold starts. Every new exercise pays setup cost again, which is the exact cost this repo exists to remove.
- **Static HTML per prototype** — no Supabase, no typed data layer, no shared design system. Fine for a one-off; useless as a kit.
- **Filesystem auto-discovery instead of a registry** — removes one line of bookkeeping at the cost of type safety and a dynamic import Next cannot statically analyse. The registry is explicit, typed, and `generateStaticParams` prerenders from it.

## Consequences
**Easy:** one deploy, one domain, one env setup; shared tokens and primitives, so every prototype looks coherent without effort; `pnpm new` to live URL in about a minute.

**Hard:** prototypes share a dependency tree — one cannot pin React 18 while another uses 19. A prototype that needs a genuinely different stack does not belong here and should be its own repo. The `load` entries stay dynamic imports precisely so a twenty-prototype gallery does not ship twenty bundles; a static import there would quietly undo that.
