import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
        "Add it to your .env.local file."
    );
  }
  return url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. " +
        "This key must only be used server-side."
    );
  }
  return key;
}

/**
 * Admin Supabase client that bypasses Row Level Security.
 *
 * WARNING: Never expose this client or import this module from client-side
 * code. The service-role key has full database access.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
