
import { NextResponse } from 'next/server';
import { getAuthDebugInfo } from '@/lib/auth-debug';

/**
 * An API route specifically for testing and debugging cookie propagation.
 * It calls a server-side utility to get the status of the auth cookie
 * and returns it as a JSON response.
 */
export async function GET() {
  try {
    const debugInfo = await getAuthDebugInfo();
    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get debug info.', details: error.message },
      { status: 500 }
    );
  }
}
