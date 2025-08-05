import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Endpoint de testing para verificar si las cookies de autenticación 
 * están disponibles en el contexto del servidor
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const firebaseToken = cookieStore.get('firebaseIdToken');
    
    return NextResponse.json({
      hasCookie: !!firebaseToken?.value,
      cookieLength: firebaseToken?.value?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in test-cookie route:', error);
    return NextResponse.json({
      hasCookie: false,
      error: 'Failed to access cookies',
      timestamp: new Date().toISOString(),
    });
  }
}