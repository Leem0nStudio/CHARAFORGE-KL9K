/**
 * @fileoverview
 * This file provides server-side utilities for debugging authentication issues,
 * specifically related to cookie propagation and session verification.
 */

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';

interface DebugInfo {
  timestamp: string;
  hasCookie: boolean;
  cookieValue?: string;
  isTokenValid: boolean;
  decodedToken?: object;
  error?: string;
}

/**
 * Provides a detailed report on the current state of the authentication cookie
 * as seen by the server.
 * @returns {Promise<DebugInfo>} A promise that resolves to an object containing debug information.
 */
export async function getAuthDebugInfo(): Promise<DebugInfo> {
  const timestamp = new Date().toISOString();
  
  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      return {
        timestamp,
        hasCookie: false,
        isTokenValid: false,
        error: 'No "firebaseIdToken" cookie found on the server.',
      };
    }

    if (!adminAuth) {
        return {
            timestamp,
            hasCookie: true,
            cookieValue: idToken.substring(0, 30) + '...', // Don't log the full token
            isTokenValid: false,
            error: 'Firebase Admin Auth service is not initialized on the server.'
        }
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return {
        timestamp,
        hasCookie: true,
        cookieValue: idToken.substring(0, 30) + '...',
        isTokenValid: true,
        decodedToken: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          auth_time: new Date(decodedToken.auth_time * 1000).toISOString(),
          exp: new Date(decodedToken.exp * 1000).toISOString(),
        },
      };
    } catch (error: any) {
      return {
        timestamp,
        hasCookie: true,
        cookieValue: idToken.substring(0, 30) + '...',
        isTokenValid: false,
        error: `Token verification failed: ${error.message}`,
      };
    }
  } catch (error: any) {
    return {
      timestamp,
      hasCookie: false,
      isTokenValid: false,
      error: `Error reading cookies on server: ${error.message}`,
    };
  }
}

    