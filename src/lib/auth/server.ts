
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/firebase/server';

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
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User session not found. Please log in again.');
  }

  return session.user.id;
}


/**
 * A wrapper around `verifyAndGetUid` that also checks if the user has admin
 * privileges based on their custom claims.
 *
 * This should be called at the beginning of any server action that requires
 * administrative permissions.
 *
 * @throws {Error} If the user is not an admin or fails any of the underlying auth checks.
 * @returns {Promise<string>} A promise that resolves to the authenticated admin's UID.
 */
export async function verifyIsAdmin(): Promise<string> {
    const uid = await verifyAndGetUid();
    
    // We still use Firebase Admin SDK for custom claims until that is also migrated.
    // This part of the logic remains the same.
    if (!adminAuth) {
        throw new Error('Authentication admin service is unavailable on the server.');
    }
    try {
        const userRecord = await adminAuth.getUser(uid);
        if (userRecord.customClaims?.admin === true) {
            return uid;
        }
        throw new Error('User does not have admin privileges.');
    } catch (error) {
        console.error('Admin verification failed:', error);
        throw new Error('Permission denied. User is not an administrator.');
    }
}
