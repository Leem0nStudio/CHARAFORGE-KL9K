
/**
 * @fileoverview Supabase client for server-side usage.
 * This file provides a function to get a Supabase client instance
 * configured for server-side operations, such as in Server Actions
 * and API routes. It correctly handles cookies for authentication.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// This function now returns a promise of the client or null if the keys are missing.
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  const cookieStore = cookies();

  // Ensure that the environment variables are set.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
     console.warn('Supabase server environment variables are not set. Server-side operations will be disabled.');
     return null;
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This can happen in Server Components, but it's safe to ignore
            // as the Supabase client will still work for read operations.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Same as above, safe to ignore in certain contexts.
          }
        },
      },
    }
  );
}
