-- 0002_signal_board
--
-- Backing table for the `signal-board` prototype: a shared wall anyone can
-- post to, where you may only edit or delete your own note.
--
-- This is the mixed-visibility RLS shape most prototypes eventually need
-- (public read + owner write), kept as a worked reference. Copy it; do not
-- reach for `using (true)` on writes because "it's only a demo".

create table public.board_note (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_label text not null check (length(author_label) between 1 and 32),
  body         text not null check (length(btrim(body)) between 1 and 280),
  tone         text not null default 'amber'
                 check (tone in ('amber', 'iris', 'jade', 'rose', 'slate')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.board_note is
  'Shared prototype board. Public read, owner-only write — see 0002 for the policy shape.';

create index board_note_created_idx on public.board_note (created_at desc);

create trigger board_note_touch
  before update on public.board_note
  for each row execute function public.touch_updated_at();

alter table public.board_note enable row level security;

-- Public read: the board is the demo, and a signed-out visitor must see it.
create policy board_note_select_all on public.board_note
  for select to anon, authenticated using (true);

-- Writes are owner-only. `with check` on insert is what stops a client from
-- posting under someone else's id by sending its own author_id.
create policy board_note_insert_own on public.board_note
  for insert to authenticated with check (author_id = (select auth.uid()));

create policy board_note_update_own on public.board_note
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy board_note_delete_own on public.board_note
  for delete to authenticated using (author_id = (select auth.uid()));

-- Realtime: the board streams inserts/updates/deletes to every open tab.
alter publication supabase_realtime add table public.board_note;
