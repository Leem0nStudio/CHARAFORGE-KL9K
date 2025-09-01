/**
 * @fileoverview Supabase client for browser-side usage.
 * This file initializes and exports a Supabase client instance that is safe
 * to use in React Client Components. It reads the public Supabase URL and
 * anon key from environment variables.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// This function now returns the client or null if the keys are missing.
export function getSupabaseBrowserClient(): SupabaseClient<any, any, any, any, any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // This should ideally not happen if env vars are set, but it's a safeguard.
    throw new Error('Supabase environment variables are not set. Supabase client-side features will be disabled.');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
