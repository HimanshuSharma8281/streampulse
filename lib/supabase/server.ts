import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    (supabaseServiceRoleKey || supabaseAnonKey) &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
  );
}

/**
 * Creates a server-side Supabase client.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY to bypass RLS for administrative mutations,
 * with fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key) return null;

  return createClient(supabaseUrl!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
