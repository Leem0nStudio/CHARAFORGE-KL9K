
'use server';

import { upload } from '@vercel/blob/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * A centralized, robust function to upload a file to Vercel Blob via our internal API route.
 * It can handle both File objects (from form data) and Data URIs (from AI generation).
 * 
 * @param {File | Buffer | string} fileSource The source of the file. Can be a File object, a Buffer, or a Data URI string.
 * @param {string} destinationPath The desired path prefix in the blob store (e.g., 'usersImg/uid/characterId'). A unique ID will be appended.
 * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded file.
 * @throws {Error} Throws an error if the upload fails.
 */
export async function uploadToStorage(
    fileSource: File | Buffer | string,
    destinationPath: string
): Promise<string> {

    let fileToUpload: File;
    const fileName = `${destinationPath}/${uuidv4()}`;

    if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
        const match = fileSource.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error('Invalid Data URI format.');
        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        fileToUpload = new File([buffer], `${uuidv4()}.png`, { type: contentType });
    } else if (fileSource instanceof File) {
        fileToUpload = fileSource;
    } else if (fileSource instanceof Buffer) {
        // Assume png if buffer is provided without type
        fileToUpload = new File([fileSource], `${uuidv4()}.png`, { type: 'image/png' });
    } else {
        throw new Error("Unsupported file source type.");
    }

    try {
        const blob = await upload(fileName, fileToUpload, {
            access: 'public',
            handleUploadUrl: '/api/upload', // The new API route we created
        });
        
        return blob.url;

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown storage error occurred.';
        console.error(`Vercel Blob Upload Error for path ${destinationPath}:`, message);
        throw new Error(`Failed to upload file via Vercel Blob: ${message}`);
    }
}
