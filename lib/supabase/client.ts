import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase Browser Client Configuration Error:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Available' : 'UNDEFINED',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Available' : 'UNDEFINED',
    })
    throw new Error(
      `Missing Supabase browser client environment variables. URL is ${
        supabaseUrl ? 'defined' : 'MISSING'
      } and Anon Key is ${supabaseAnonKey ? 'defined' : 'MISSING'}.`
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
