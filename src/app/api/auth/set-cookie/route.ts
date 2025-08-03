import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'firebaseIdToken';

export async function POST(request: NextRequest) {
  console.log('[set-cookie] POST request received.');
  const { token } = await request.json();
  const response = NextResponse.json({ success: true });

  if (token) {
    console.log('[set-cookie] Token received. Setting auth cookie.');
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
  } else {
    console.log('[set-cookie] No token received. Clearing auth cookie.');
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });
  }

  console.log('[set-cookie] Sending response.');
  return response;
}
