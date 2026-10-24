import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from '@/lib/supabase/client';

export function createSupabaseServerClient() {
  return createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
