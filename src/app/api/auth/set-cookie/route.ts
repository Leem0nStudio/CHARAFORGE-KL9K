import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

const AUTH_COOKIE_NAME = 'firebaseIdToken';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const response = NextResponse.json({ success: true });

    if (token) {
      // Validar el token antes de establecer la cookie
      if (adminAuth) {
        try {
          await adminAuth.verifyIdToken(token);
        } catch (error) {
          console.error('Invalid token provided to set-cookie:', error);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }

      // Configuración mejorada de cookies para mejor compatibilidad
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // CRÍTICO: Permite que las cookies se envíen en navegación same-site
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });
    } else {
      // Limpiar cookie cuando no hay token
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error('Error in set-cookie route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
