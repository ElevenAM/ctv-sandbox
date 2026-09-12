import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env, hasSupabase } from '@/lib/env'

/**
 * Refreshes the Supabase auth token on every navigation so Server Components
 * read a live session. Without this, a token that expires mid-visit makes
 * authed prototypes look broken.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  if (!hasSupabase) return response

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) response.cookies.set(name, value, options)
        },
      },
    },
  )

  // Rule 8: getUser() (not getSession()) is what revalidates the token here.
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)'],
}
