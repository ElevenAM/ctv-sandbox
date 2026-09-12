# AGENTS.md

Read [`CLAUDE.md`](CLAUDE.md). It is the working agreement for this repo and it is binding — conventions there override your defaults.

If you are here to build something under a clock, read [`PLAYBOOK.md`](PLAYBOOK.md) first: it is the first ten minutes, in order.

Three things that catch every new session out:

1. **A prototype is a folder plus one registry line.** Run `pnpm new <slug>`. Never hand-edit `src/prototypes/registry.ts`, and never edit `src/app/` to add a prototype.
2. **`pnpm gate` is CI.** There is no GitHub Actions workflow here. A green gate is the only evidence that exists — and it still does not mean "it works" until you have opened the page.
3. **Node is under fnm** and is not on a bare shell's `PATH`. Tool calls get it from `.claude/settings.json`; a terminal needs `eval "$(fnm env)"`.
