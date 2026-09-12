'use client'

import type { User } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/client'
import { err, ok, type Result } from '@/lib/result'

/**
 * Gets the visitor a real `auth.uid()` without asking them to sign up.
 *
 * Supabase anonymous sign-in issues a genuine JWT, which is what makes the RLS
 * in `supabase/migrations/` actual row isolation rather than a client-side
 * convention. Every DB-backed prototype starts here.
 *
 * The failure that matters is `anonymous_provider_disabled` — a project-level
 * toggle, not a code bug. It is named explicitly so the UI can print the fix
 * instead of a shrug (CLAUDE.md rule 1).
 */
export const ANON_DISABLED = 'anon-auth/disabled' as const

export async function ensureVisitor(): Promise<Result<User>> {
  const client = getBrowserClient()
  if (!client.ok) return client

  const { data: existing } = await client.value.auth.getUser()
  if (existing.user) return ok(existing.user)

  const { data, error } = await client.value.auth.signInAnonymously()
  if (error) {
    if (error.code === 'anonymous_provider_disabled') {
      console.error('[visitor] anonymous sign-ins are disabled on this Supabase project')
      return err(ANON_DISABLED)
    }
    console.error(`[visitor] signInAnonymously failed: ${error.message}`, error)
    return err(`visitor/signin: ${error.message}`)
  }
  if (!data.user) return err('visitor/signin: no user returned')

  return ok(data.user)
}

/** Stable, non-identifying handle derived from the visitor id. */
export function visitorLabel(userId: string): string {
  const ADJECTIVES = ['Quiet', 'Amber', 'Rapid', 'Candid', 'Lucid', 'Stray', 'Bright', 'Even']
  const NOUNS = ['Heron', 'Ember', 'Vector', 'Pilot', 'Harbor', 'Signal', 'Atlas', 'Cedar']

  // Cheap deterministic hash — this labels a demo note, it is not a security
  // boundary, and the ids it consumes are already opaque.
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0

  const adjective = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length] ?? 'Quiet'
  const noun = NOUNS[Math.abs(hash >> 5) % NOUNS.length] ?? 'Signal'
  return `${adjective} ${noun}`
}
