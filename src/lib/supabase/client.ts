import { createBrowserClient } from "@supabase/ssr";

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

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add it to your .env.local file."
    );
  }
  return key;
}

/**
 * Browser-side Supabase client.
 *
 * Safe to import in Client Components. Uses the anonymous key — all queries
 * are subject to Row Level Security.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
