import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase Server Client Configuration Error:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Available' : 'UNDEFINED',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Available' : 'UNDEFINED',
    })
    throw new Error(
      `Missing Supabase server client environment variables. URL is ${
        supabaseUrl ? 'defined' : 'MISSING'
      } and Anon Key is ${supabaseAnonKey ? 'defined' : 'MISSING'}.`
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
