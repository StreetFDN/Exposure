import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * This client reads and writes cookies through Next.js `cookies()` so that
 * the Supabase auth session is preserved across server-rendered requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` is called from a Server Component where cookies cannot
          // be mutated. This is safe to ignore — the middleware or a Route
          // Handler will pick up the refresh on the next request.
        }
      },
    },
  });
}
