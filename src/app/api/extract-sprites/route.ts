
'use server';

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { verifyAndGetUid } from '@/lib/auth/server';

// --- Helper Functions ---

/**
 * Calls the external Python service to remove the background from an image.
 * @param {Buffer} imageBuffer The original image buffer.
 * @returns {Promise<Buffer>} The image buffer with the background removed.
 * @throws {Error} If the background removal service fails.
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const rembgApiUrl = process.env.REMBG_API_URL;
  if (!rembgApiUrl) {
    console.error('REMBG_API_URL is not set in the environment variables.');
    throw new Error('Background removal service is not configured.');
  }

  try {
    const response = await fetch(rembgApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Background removal service failed with status ${response.status}:`, errorBody);
      throw new Error(`Background removal service failed. Status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error calling background removal service:', error);
    throw new Error('Could not connect to the background removal service.');
  }
}

/**
 * Uploads a buffer to Firebase Storage and returns its public URL.
 * @param {Buffer} buffer The buffer of the file to upload.
 * @param {string} destinationPath The path in the bucket where the file will be stored.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadToStorage(buffer: Buffer, destinationPath: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(destinationPath);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/png',
    },
  });

  // Return the public URL, which is a permanent link to the object.
  return file.publicUrl();
}

// --- Main API Handler ---

export async function POST(request: Request) {
  try {
    const uid = await verifyAndGetUid();
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const optionsString = formData.get('options') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    const options = optionsString ? JSON.parse(optionsString) : {};
    const minArea = options.minArea || 10; // Default to 10 if not provided

    const originalImageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // 1. Remove background by calling the external service
    const noBgImageBuffer = await removeBackground(originalImageBuffer);

    // 2. Use sharp to find connected components (the sprites)
    const { objects } = await sharp(noBgImageBuffer)
      .png()
      .connectedComponents();

    if (!objects || objects.length === 0) {
        return NextResponse.json({ error: 'No sprites could be detected in the image.' }, { status: 400 });
    }
    
    const spriteUploadPromises: Promise<string>[] = [];
    const spriteSize = 256; // Define a standard size for sprites

    // 3. Process each detected sprite
    for (const obj of objects) {
      const area = obj.width * obj.height;
      // Filter out small objects based on minArea option
      if (area < minArea) {
          continue;
      }

      // Extract (crop) the sprite using its bounding box
      const spriteBuffer = await sharp(noBgImageBuffer)
        .extract({
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
        })
        .resize(spriteSize, spriteSize, { 
            fit: 'contain', 
            background: { r: 0, g: 0, b: 0, alpha: 0 } 
        })
        .png()
        .toBuffer();

      // 4. Upload each processed sprite to Firebase Storage
      const spriteId = randomUUID();
      const destinationPath = `sprite-exports/${uid}/${spriteId}.png`;
      spriteUploadPromises.push(uploadToStorage(spriteBuffer, destinationPath));
    }

    const spriteUrls = await Promise.all(spriteUploadPromises);
    
    // 5. Return the list of public URLs
    return NextResponse.json({ spriteUrls });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('[EXTRACT_SPRITES_ERROR]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
