
'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';

/**
 * @fileoverview This file contains the server-side authentication gatekeeper.
 * It follows the "Secure Session Management" pattern outlined in ARCHITECTURE_GUIDE.md.
 */

/**
 * A centralized, robust function to verify a user's session from the server-side.
 * It reads the Firebase ID token from the secure, HTTPOnly request cookie and 
 * verifies it using the Firebase Admin SDK.
 * 
 * This is the **only** approved method for protecting server actions and API routes.
 * 
 * @throws {Error} If services are unavailable, the cookie is missing, or the token is invalid/expired.
 * @returns {Promise<string>} A promise that resolves to the authenticated user's UID.
 */
export async function verifyAndGetUid(): Promise<string> {
  if (!adminAuth) {
    throw new Error('Authentication service is unavailable on the server.');
  }

  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    throw new Error('User session not found. Please log in again.');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    // This error is caught and re-thrown to give a clearer message to the client.
    throw new Error('Invalid or expired user session. Please log in again.');
  }
}

    