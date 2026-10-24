import { createBrowserClient } from '@supabase/ssr';

export const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://runquwuetzfivhwefenk.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bnF1d3VldHpmaXZod2VmZW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NzQ3NjcsImV4cCI6MjEwODM1MDc2N30.p1NUazwhrnsol-logGVcRD3Y5GOtqwvaQBYraRA4oTI';

export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
}
