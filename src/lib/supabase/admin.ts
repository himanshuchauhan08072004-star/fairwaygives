import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. Never import this in client components.
// Bypasses RLS — use only for trusted server logic (webhooks, draw engine, admin actions).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
