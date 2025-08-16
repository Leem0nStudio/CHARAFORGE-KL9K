import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'firebaseIdToken';

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const response = NextResponse.json({ success: true });

  if (token) {
    // This configuration is more robust and secure for modern browsers.
    // 'lax' is a good default for sameSite, and 'secure: true' is necessary
    // for production and works well with modern dev environments like Studio.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
  } else {
    // When deleting the cookie, ensure all relevant properties match the
    // ones used when setting it.
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

    