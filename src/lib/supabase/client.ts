'use client'

import { createBrowserClient } from '@supabase/ssr'
import { env, hasSupabase } from '@/lib/env'
import { err, ok, type Result } from '@/lib/result'
import type { Database } from './database.types'

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

let cached: BrowserClient | null = null

/**
 * Browser-side Supabase client, memoised for the tab.
 *
 * Returns a `Result` rather than throwing so a prototype rendered without
 * `.env.local` degrades to its failed state instead of blanking the page.
 */
export function getBrowserClient(): Result<BrowserClient> {
  if (!hasSupabase) return err('supabase/env: NEXT_PUBLIC_SUPABASE_* missing — copy .env.example to .env.local')
  cached ??= createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  return ok(cached)
}
