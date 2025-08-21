
'use server';

import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/firebase/server';

/**
 * A centralized, robust function to upload a file to Firebase Storage.
 * It can handle both File objects (from form data) and Data URIs (from AI generation).
 * 
 * @param {File | Buffer | string} fileSource The source of the file. Can be a File object, a Buffer, or a Data URI string.
 * @param {string} destinationPath The full path in the Storage bucket where the file will be saved (e.g., 'usersImg/uid/characterId/image.png').
 * @param {string} [contentType] Optional. The MIME type of the file. Required if the source is a Buffer.
 * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded file.
 * @throws {Error} Throws an error if the upload fails or the configuration is invalid.
 */
export async function uploadToStorage(
    fileSource: File | Buffer | string,
    destinationPath: string,
    contentType?: string,
): Promise<string> {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        throw new Error('Firebase Storage bucket is not configured in environment variables.');
    }
    
    if (!adminDb) {
        throw new Error('Firebase Admin DB service is not initialized.');
    }

    const bucket = getStorage().bucket(storageBucket);
    const fileRef = bucket.file(destinationPath);
    
    let buffer: Buffer;
    let finalContentType: string | undefined = contentType;

    if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
        // Handle Data URI
        const match = fileSource.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) {
            throw new Error('Invalid Data URI format provided to uploadToStorage.');
        }
        finalContentType = match[1];
        buffer = Buffer.from(match[2], 'base64');
    } else if (fileSource instanceof File) {
        // Handle File object
        buffer = Buffer.from(await fileSource.arrayBuffer());
        finalContentType = fileSource.type;
    } else if (fileSource instanceof Buffer) {
        // Handle Buffer
        buffer = fileSource;
        if (!finalContentType) {
            throw new Error("Content type must be provided when uploading a Buffer.");
        }
    } else {
        throw new Error("Unsupported file source type provided to uploadToStorage.");
    }
    
    if (!finalContentType) {
        throw new Error("Could not determine content type for upload.");
    }

    try {
        await fileRef.save(buffer, {
            metadata: {
                contentType: finalContentType,
                cacheControl: 'public, max-age=31536000', // Cache aggressively for 1 year
            },
            public: true,
        });

        return fileRef.publicUrl();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown storage error occurred.';
        console.error(`Storage Upload Error to path ${destinationPath}:`, message);
        // Re-throw a more specific error to be caught by server actions
        throw new Error(`Failed to upload file to Firebase Storage: ${message}`);
    }
}
