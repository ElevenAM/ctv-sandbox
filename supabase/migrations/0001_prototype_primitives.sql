-- 0001_prototype_primitives
--
-- Shared storage every prototype can use WITHOUT shipping its own migration.
-- One generic owner-scoped table beats N bespoke tables (ponytail rung 2): a
-- new prototype persists state on day one and only earns real tables when its
-- shape outgrows a jsonb blob.
--
-- Identity is Supabase ANONYMOUS auth — `auth.uid()` is a real user id, so RLS
-- is genuine row isolation, not a client-side convention. No login UI needed.

-- ---------------------------------------------------------------- helpers --

-- Keeps `updated_at` honest without trusting the client to send it.
-- `search_path` is pinned empty: a mutable path on a trigger function lets a
-- schema earlier on the caller's path shadow what it calls. get_advisors flags
-- this, and the gate treats a security advisor as blocking.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------- prototype_state --

create table public.prototype_state (
  id             uuid primary key default gen_random_uuid(),
  prototype_slug text not null check (prototype_slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key            text not null check (length(key) between 1 and 128),
  value          jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (prototype_slug, owner_id, key)
);

comment on table public.prototype_state is
  'Per-visitor scratch storage keyed by prototype. Owner-scoped via RLS.';

create index prototype_state_owner_slug_idx
  on public.prototype_state (owner_id, prototype_slug);

create trigger prototype_state_touch
  before update on public.prototype_state
  for each row execute function public.touch_updated_at();

alter table public.prototype_state enable row level security;

-- Four explicit policies. A single FOR ALL policy hides which verb actually
-- opened the door when something leaks.
create policy prototype_state_select_own on public.prototype_state
  for select to authenticated using (owner_id = (select auth.uid()));

create policy prototype_state_insert_own on public.prototype_state
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy prototype_state_update_own on public.prototype_state
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy prototype_state_delete_own on public.prototype_state
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ------------------------------------------------------ prototype_signal --

-- Append-only demo telemetry: "did anyone actually press the thing".
-- Writable by any visitor, readable by NOBODY through the API — read it in the
-- SQL editor. Insert-only is the whole point; do not add a select policy.
create table public.prototype_signal (
  id             bigint generated always as identity primary key,
  prototype_slug text not null check (prototype_slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  name           text not null check (length(name) between 1 and 64),
  payload        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

comment on table public.prototype_signal is
  'Append-only prototype telemetry. Insert-only by design: no SELECT policy exists.';

create index prototype_signal_slug_created_idx
  on public.prototype_signal (prototype_slug, created_at desc);

alter table public.prototype_signal enable row level security;

create policy prototype_signal_insert_any on public.prototype_signal
  for insert to anon, authenticated with check (true);
