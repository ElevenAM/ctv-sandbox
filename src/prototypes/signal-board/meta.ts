import type { PrototypeMeta } from '@/prototypes/types'

export const meta: PrototypeMeta = {
  slug: 'signal-board',
  index: 'EX-01',
  title: 'Signal Board',
  tagline: 'A shared wall where anyone can post and only you can edit yours',
  summary:
    'The reference implementation for a multiplayer surface on Supabase: anonymous auth for a real auth.uid(), public-read / owner-write RLS, Postgres realtime streaming every change to every open tab, and optimistic posting that rolls back honestly when the insert is refused. Open it in two windows.',
  status: 'live',
  tone: 'iris',
  tags: ['supabase', 'realtime', 'rls', 'optimistic-ui'],
  updated: '2026-09-11',
  capabilities: ['supabase', 'anon-auth', 'realtime'],
  brief: 'docs/prototypes/signal-board.md',
}
