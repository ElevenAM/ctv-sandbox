# Signal Board (EX-01)

**Status:** live · **Updated:** 2026-09-11 · **Route:** `/p/signal-board`

## What it is
A shared wall. Anyone who opens the page can post a short note in one of five colours; every note appears instantly in every other open tab. You can delete your own notes and nobody else's — enforced by the database, not by hiding the button.

## Why it exists
This is the **reference pattern for a multiplayer surface** in this repo. Copy from it rather than inventing:

- **`supabase/migrations/0002_signal_board.sql`** — the public-read / owner-write RLS shape. Four explicit policies instead of one `FOR ALL`, and `with check` on insert, which is the clause that stops a client posting under someone else's id.
- **`src/lib/visitor.ts`** — anonymous sign-in, so `auth.uid()` is a real user id and the RLS above is genuine row isolation rather than a client-side convention. No login UI.
- **`Prototype.tsx` `post()`** — optimistic insert with an honest rollback: on refusal the note is removed, **the text goes back into the box**, and the error says so. Losing someone's typing is the worst thing a prototype can do.
- **`Prototype.tsx` failed state** — names the exact Supabase toggle to flip. An error message that a reader can act on beats a correct one they cannot.

## How it works
Client-side throughout, because anonymous auth and the realtime socket both need the browser (CLAUDE.md rule 8 would otherwise push the first read to the server).

`ensureVisitor()` → `select` the 60 newest notes → subscribe to `postgres_changes` on `board_note`. The realtime callback reconciles three events; on `INSERT` it drops any matching optimistic row rather than adding a duplicate.

`visitorRef` mirrors the visitor for that callback, which closes over its first render — assigned beside the setter, never from an effect (rule 6). The mount fetch carries an `isCurrent` cancellation guard (rule 7).

## Verified
`2026-09-12`, against the live project in a browser:

- Post → the note round-trips and renders with its tone accent.
- **Realtime INSERT** — a note posted in tab two appears in tab one with no reload.
- **Realtime DELETE** — removing it in tab one clears it from tab two, and the board falls back to the *empty* state (not a stale loading or failed state).
- **RLS**, via `pnpm check:rls`: 10/10. A second visitor cannot post as the first (`403`, `with check` doing its job), cannot delete or edit their note (0 rows affected), and cannot read their `prototype_state`. A signed-out visitor can still read the board.
- Zero console errors on a tab opened after anonymous sign-in was enabled.

## Known ceilings
- **Loads 60 notes, no pagination.** Past that the board silently truncates to the newest. Add a cursor if it ever matters — for a demo, it does not.
- **Optimistic reconciliation matches on `author_id` + `body`.** Posting the same text twice in quick succession can drop the wrong placeholder. A client-generated id round-tripped through the insert would fix it; not worth the column here.
- **`author_label` is stored per row**, so it is whatever the label function produced at post time. Renaming the scheme will not rewrite history.
- **Anonymous users accumulate.** One `auth.users` row per visitor per browser, never cleaned up. Fine for a sandbox, not for a product.
