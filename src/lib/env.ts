import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_PLATFORM_NAME: z.string().default("Exposure"),
  NEXT_PUBLIC_PLATFORM_URL: z.string().url().default("http://localhost:3000"),
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

// Only validate on server side
export const env =
  typeof window === "undefined"
    ? envSchema.parse(process.env)
    : ({} as z.infer<typeof envSchema>);
