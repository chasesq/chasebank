import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using service role key.
 *
 * This app uses custom auth (password hashing + OTP) instead of Supabase Auth,
 * so auth.uid() is not available for RLS policies. We use the service role key
 * to bypass RLS on all server-side operations.
 *
 * IMPORTANT: Only use this in server-side API routes, never expose to client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('[v0] Missing Supabase environment variables (URL or SERVICE_ROLE_KEY)')
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
