'use client';

/**
 * Utilidades para diagnosticar problemas de autenticación entre cliente y servidor
 */

import { getFirebaseClient } from '@/lib/firebase/client';

export interface AuthDebugInfo {
  hasAuthUser: boolean;
  userUid?: string;
  tokenExists: boolean;
  tokenLength?: number;
  cookieWillBeSet: boolean;
  timestamp: string;
}

/**
 * Obtiene información de debugging sobre el estado de autenticación
 */
export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  const { auth } = getFirebaseClient();
  const user = auth.currentUser;
  
  let tokenExists = false;
  let tokenLength = 0;
  let cookieWillBeSet = false;
  
  if (user) {
    try {
      const token = await user.getIdToken();
      tokenExists = !!token;
      tokenLength = token.length;
      cookieWillBeSet = true;
    } catch (error) {
      console.error('Error getting token for debug:', error);
    }
  }
  
  return {
    hasAuthUser: !!user,
    userUid: user?.uid,
    tokenExists,
    tokenLength,
    cookieWillBeSet,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica si las cookies están siendo enviadas correctamente
 */
export async function testCookieAccess(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/test-cookie', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.hasCookie;
    }
    return false;
  } catch (error) {
    console.error('Error testing cookie access:', error);
    return false;
  }
}

/**
 * Función de debugging para server actions
 * Llamar antes de ejecutar una server action para diagnosticar problemas
 */
export async function debugServerActionAuth(): Promise<void> {
  const debugInfo = await getAuthDebugInfo();
  const cookieAccessible = await testCookieAccess();
  
  console.group('🔍 Auth Debug Info');
  console.table(debugInfo);
  console.log('Cookie accessible from server:', cookieAccessible);
  console.groupEnd();
  
  if (!debugInfo.hasAuthUser) {
    console.warn('⚠️ No authenticated user found');
  }
  
  if (!cookieAccessible) {
    console.warn('⚠️ Server cannot access authentication cookie');
  }
}