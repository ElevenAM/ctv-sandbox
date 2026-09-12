# ctv-sandbox

**A starter kit for building hosted prototypes fast — under a clock, without cutting the corners that get noticed.**

Clone it, run one command, and the platform is already solved: Next.js 16, Supabase with real row-level security, Vercel hosting, a token-based design system, a prototype registry, six skills, and six MCP servers. What is left is the exercise.

```bash
pnpm install && pnpm gate      # green? everything below is already working
pnpm dev                       # http://localhost:3000
pnpm new my-idea               # scaffolds + registers a prototype at /p/my-idea
```

> **Building against a clock?** Start at [`PLAYBOOK.md`](PLAYBOOK.md) — the first ten minutes, in order.
> **Writing code here?** [`CLAUDE.md`](CLAUDE.md) is binding. So is [`DESIGN.md`](DESIGN.md).

---

## How it works

**A prototype is a folder.**

```
src/prototypes/my-idea/
  meta.ts          title, tagline, tags, capabilities
  Prototype.tsx    one component — the shell gives you the rest
```

Plus one line in [`src/prototypes/registry.ts`](src/prototypes/registry.ts), which `pnpm new` writes for you. That is the whole contract. You get:

- a route at `/p/my-idea`, prerendered at build
- a card in the gallery, filterable by tag
- the page shell — header, footer, theme toggle, skip link
- the design system, the four data states, and a typed Supabase client
- its own JS chunk, so the gallery never ships twenty prototypes nobody opened

Delete the folder and the registry line and nothing else breaks.

## What is already built

| | |
| --- | --- |
| **Design system** | OKLCH tokens, six type roles, light/dark/system with no flash, `prefers-reduced-motion`, visible focus. Never write a hex. |
| **Four data states** | `LoadingState` · `EmptyState` · `FilteredEmptyState` · `FailedState`. Distinct, importable, non-negotiable. |
| **`Result<T>`** | Failures are data, not exceptions. Branch on `.ok`; never render a `reason`. |
| **Supabase** | Browser + server + middleware clients, generated types, anonymous visitor auth so RLS is real. |
| **Two shared tables** | `prototype_state` (per-visitor scratch — persist without a migration) and `prototype_signal` (append-only telemetry). |
| **The gate** | `pnpm gate` = typecheck + lint + build. There is no GitHub Actions here; this is CI. |
| **Scaffold** | `pnpm new <slug>` — folder, registry entry, brief stub, next index code. |

## Reference prototypes

Two, kept deliberately small. They exist to be **copied**, not admired.

- **[EX-01 Signal Board](docs/prototypes/signal-board.md)** (`/p/signal-board`) — the multiplayer pattern. Anonymous auth, public-read/owner-write RLS, Postgres realtime, optimistic writes with an honest rollback that puts your text back. Open it in two windows.
- **[EX-02 Token Lab](docs/prototypes/token-lab.md)** (`/p/token-lab`) — the no-database pattern, and a live proof that nothing hard-codes a colour. Drag a hue; everything follows. WCAG contrast scored as you go.

## Skills

Run with `/<name>`. Defined in [`.claude/skills/`](.claude/skills/).

| | |
| --- | --- |
| **`/exercise-brief`** | Prompt → scope, ranked journeys, out-of-scope list, time box. **Run this first.** |
| **`/new-prototype`** | Scaffold and build one to the repo's standard. |
| **`/design-research`** | Mobbin references → decisions in this repo's tokens. |
| **`/ship`** | Live on Vercel, and verified in a browser. |
| **`/gate`** | Full verification. Run before claiming anything works. |
| **`/screen-review`** | Grade a screen against DESIGN.md §9. |
| **`/ponytail-review`** | What can this diff delete? |

## MCP servers

[`.mcp.json`](.mcp.json) — approve on first use. **supabase** (migrations, advisors, types) · **vercel** (deploy, logs) · **mobbin** (UI references) · **figma** (design → code) · **chrome-devtools** and **playwright** (drive the real page).

## Setup

`.env.local` is gitignored; copy the example and fill it. Both variables are `NEXT_PUBLIC_` and safe to expose — a service-role key has no place in this repo.

```bash
cp .env.example .env.local
```

Prototypes that do not touch the database work without this, by design.

**One manual step** for the database-backed prototypes: Supabase dashboard → **Authentication → Sign In / Providers** → enable **Anonymous sign-ins**. It is what gives each visitor a real `auth.uid()`, which is what makes the RLS genuine. Already set in [`supabase/config.toml`](supabase/config.toml), so `supabase config push` does it too once the CLI is logged in. Until then `/p/signal-board` renders its failed state and names this fix — which is the behaviour we want from a failure, not a bug.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Supabase (Postgres 17, RLS, Realtime) · Vercel · pnpm · Node 22 via fnm.
