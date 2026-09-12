import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env, hasSupabase } from '@/lib/env'
import { err, ok, type Result } from '@/lib/result'
import type { Database } from './database.types'

type ServerClient = ReturnType<typeof createServerClient<Database>>

/**
 * Server-side Supabase client bound to the request's cookies.
 *
 * Never memoise this — one client per request, or you leak one user's session
 * into another user's render.
 */
export async function getServerClient(): Promise<Result<ServerClient>> {
  if (!hasSupabase) return err('supabase/env: NEXT_PUBLIC_SUPABASE_* missing — copy .env.example to .env.local')

  const store = await cookies()
  const client = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) store.set(name, value, options)
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // `middleware.ts` refreshes the session, so this is the documented
            // no-op case — degraded but functional (rule 2), not an error.
          }
        },
      },
    },
  )
  return ok(client)
}
