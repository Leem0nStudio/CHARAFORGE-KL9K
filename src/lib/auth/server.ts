
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * @fileoverview This file contains the server-side authentication gatekeeper.
 * It has been updated to use the Supabase session from the middleware.
 */

/**
 * A centralized, robust function to verify a user's session from the server-side.
 * It reads the user session managed by the Supabase middleware.
 *
 * This is the **only** approved method for protecting server actions and API routes.
 *
 * @throws {Error} If services are unavailable or there is no active session.
 * @returns {Promise<string>} A promise that resolves to the authenticated user's UID.
 */
export async function verifyAndGetUid(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Authentication service is unavailable on the server.");
  }
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error fetching session:', error);
    throw new Error('Authentication service failed.');
  }

  if (!session) {
    throw new Error('User session not found. Please log in again.');
  }

  return session.user.id;
}


/**
 * A wrapper around `verifyAndGetUid` that also checks if the user has admin
 * privileges based on their role in the database.
 *
 * This should be called at the beginning of any server action that requires
 * administrative permissions.
 *
 * @throws {Error} If the user is not an admin or fails any of the underlying auth checks.
 * @returns {Promise<string>} A promise that resolves to the authenticated admin's UID.
 */
export async function verifyIsAdmin(): Promise<string> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      throw new Error("Authentication service is unavailable on the server.");
    }

    const uid = await verifyAndGetUid();
    
    try {
        const { data: user, error } = await supabase.from('users').select('role').eq('id', uid).single();
        if (error) throw error;

        if (user && user.role === 'admin') {
            return uid;
        }
        
        throw new Error('User does not have admin privileges.');

    } catch (error) {
        console.error('Admin verification failed:', error);
        throw new Error('Permission denied. User is not an administrator.');
    }
}
