import { createClient } from "@supabase/supabase-js";

/**
 * Supabase service client with admin privileges.
 * Use ONLY in server-side code (API routes, server actions).
 * Bypasses RLS — handle with care.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Falls back to anon key if service key not available (read-only ops only)
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
