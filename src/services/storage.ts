
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * A centralized, robust function to upload a file to Supabase Storage.
 * It can handle both File objects (from form data) and Data URIs (from AI generation).
 * 
 * @param {File | Buffer | string} fileSource The source of the file. Can be a File object, a Buffer, or a Data URI string.
 * @param {string} destinationPath The full path in the Storage bucket where the file will be saved (e.g., 'usersImg/uid/characterId/image.png').
 * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded file.
 * @throws {Error} Throws an error if the upload fails or the configuration is invalid.
 */
export async function uploadToStorage(
    fileSource: File | Buffer | string,
    destinationPath: string
): Promise<string> {
    const supabase = await getSupabaseServerClient();
    const bucketName = 'chara-images'; // Define a consistent bucket name

    let fileBody: File | Buffer;
    let contentType: string | undefined;

    if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
        const match = fileSource.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error('Invalid Data URI format.');
        contentType = match[1];
        fileBody = Buffer.from(match[2], 'base64');
    } else if (fileSource instanceof File) {
        fileBody = fileSource;
        contentType = fileSource.type;
    } else if (fileSource instanceof Buffer) {
        fileBody = fileSource;
        // Assume png if buffer is provided without type, can be improved.
        contentType = 'image/png';
    } else {
        throw new Error("Unsupported file source type.");
    }

    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(destinationPath, fileBody, {
                contentType,
                upsert: true, // Overwrite if file with same path exists
                cacheControl: '3600', // Cache for 1 hour, can be adjusted
            });

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        
        if (!publicUrl) {
            throw new Error("Failed to get public URL for the uploaded file.");
        }

        return publicUrl;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown storage error occurred.';
        console.error(`Supabase Storage Upload Error to path ${destinationPath}:`, message);
        throw new Error(`Failed to upload file to Supabase Storage: ${message}`);
    }
}

    