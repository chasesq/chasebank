import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for database operations
 * Uses service role key for full database access with RLS bypass
 */
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase credentials: URL or Service Role Key not set')
  }

  try {
    // Create and return the Supabase client
    const supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the client has the required methods
    if (!supabaseClient || typeof supabaseClient.from !== 'function') {
      throw new Error('Supabase client creation failed: missing expected methods')
    }

    return supabaseClient
  } catch (error) {
    console.error('[v0] Supabase client creation error:', error)
    throw error
  }
}

