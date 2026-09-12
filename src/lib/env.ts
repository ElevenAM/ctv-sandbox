import { z } from 'zod'

/**
 * Env is validated once, at the edge. A missing variable fails loudly here
 * rather than surfacing as a confusing `undefined` inside a Supabase client
 * three call frames later (CLAUDE.md rule 1 — never silent).
 *
 * Next inlines `NEXT_PUBLIC_*` at build time only when referenced statically,
 * so each key is spelled out in full below. Do not refactor to `process.env[k]`.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_NAME: z.string().default('CTV Sandbox'),
})

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
})

/**
 * Prototypes that never touch the database must still build and render on a
 * machine with no `.env.local`. So a bad env is recorded, not thrown — the
 * Supabase factories refuse with a `Result` failure, and DB-backed prototypes
 * show their failed state while everything else works.
 */
export const envIssue: string | null = parsed.success
  ? null
  : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')

export const env = parsed.success
  ? parsed.data
  : { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', NEXT_PUBLIC_SITE_NAME: 'CTV Sandbox' }

export const hasSupabase = parsed.success
