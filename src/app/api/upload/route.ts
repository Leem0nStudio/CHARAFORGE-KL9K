import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeUpload: async (pathname) => {
        // This is a good place to perform checks, like ensuring the user is authenticated.
        // For now, we'll allow all uploads from authorized clients.
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Here you could perform actions after the upload is complete,
        // like updating a database record.
        console.log('blob upload completed', blob, tokenPayload);
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will return 400 on error
    );
  }
}
