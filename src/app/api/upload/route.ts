import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upload } from '@vercel/blob/client';
 
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const blob = await upload(body.filename, body.file, {
    access: 'public',
    handleUploadUrl: process.env.BLOB_UPLOAD_URL,
  });
 
  return NextResponse.json(blob);
}
