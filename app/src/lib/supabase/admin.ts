import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — server-only, never import this from a Client Component.
// Bypasses Row Level Security, so every call site must check the caller's role first.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
