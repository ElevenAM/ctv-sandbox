# docs/

Where written work lives. Everything here is either a **template** (copy it) or a **record** (append to it).

| Folder | Holds | Written by |
| --- | --- | --- |
| `templates/` | The blank forms. Copy, never edit in place. | — |
| `exercises/` | One brief per exercise: scope, ranked journeys, out-of-scope, time-box. | `/exercise-brief` |
| `prototypes/` | One brief per prototype: what it is, why, how, known ceilings. | `pnpm new` stubs it; you finish it |
| `screens/` | One guide per reviewed screen: grades and dated findings. | `/screen-review` |
| `decisions/` | Decisions that change the shared system, with the reasoning. | You, when a choice outlives its PR |
| `screenshots/` | Evidence referenced by screen guides. | `/screen-review` |

## Conventions

- **Findings are append-only.** Check one off with the commit that fixed it; never delete it. The record of what was wrong is worth more than a tidy file.
- **Dates are absolute** (`2026-09-11`), never "last week". These files are read months later by someone with no memory of this session.
- **Every measured claim carries evidence** — a `file:line`, a screenshot, or the explicit word `unverified`. "Unverified" is a respectable answer; a confident guess is not.
- A prototype's brief is linked from its `meta.ts` `brief` field and surfaces on its page. A stale brief is a visible defect.
