import { createBrowserClient } from '@supabase/ssr'

/**
 * Check if Supabase is properly configured in the browser
 */
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') return false
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Create a Supabase client for browser use (public API key)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

