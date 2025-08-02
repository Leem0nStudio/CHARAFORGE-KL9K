import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { admin } from './lib/firebase/server';

const AUTH_COOKIE_NAME = 'firebaseIdToken';

async function verifyToken(token: string) {
  try {
    const decodedToken = await getAuth(admin).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (request.nextUrl.pathname.startsWith('/characters')) {
    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/characters/:path*'],
};
