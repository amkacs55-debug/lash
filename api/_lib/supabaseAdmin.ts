// Server-side Supabase client using the SERVICE ROLE key.
//
// This bypasses Row Level Security, which is exactly what we want here:
// only our trusted serverless functions (never the browser) should be able
// to mark a booking as paid/confirmed.
//
// Required environment variables (set in Vercel dashboard, server-side only):
//   SUPABASE_URL              - same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY - the "service_role" secret key from
//                               Supabase Dashboard > Project Settings > API
//                               (NEVER expose this to the frontend / VITE_ vars)

import { createClient } from '@supabase/supabase-js';

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your Vercel project settings.`
    );
  }
  return value;
}

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const url = getEnvOrThrow('SUPABASE_URL');
  const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}
