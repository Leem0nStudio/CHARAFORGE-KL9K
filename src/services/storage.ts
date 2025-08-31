
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * A centralized, robust function to upload a file to Supabase Storage.
 * It can handle both File objects (from form data) and Data URIs (from AI generation).
 * 
 * @param {File | Buffer | string} fileSource The source of the file. Can be a File object, a Buffer, or a Data URI string.
 * @param {string} destinationPath The full path in the Storage bucket where the file will be saved (e.g., 'usersImg/uid/characterId/imageId/image.png').
 * @param {string} [contentType] Optional. The MIME type of the file. Required if the source is a Buffer.
 * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded file.
 * @throws {Error} Throws an error if the upload fails or the configuration is invalid.
 */
export async function uploadToStorage(
    fileSource: File | Buffer | string,
    destinationPath: string,
    contentType?: string,
): Promise<string> {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
        throw new Error('Supabase client is not initialized.');
    }

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
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('character-images') // Bucket name in Supabase
            .upload(destinationPath, buffer, {
                contentType: finalContentType,
                cacheControl: '31536000', // Cache aggressively for 1 year
                upsert: true // Overwrite if file exists
            });

        if (error) {
            throw new Error(`Supabase storage upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('character-images')
            .getPublicUrl(destinationPath);

        return urlData.publicUrl;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown storage error occurred.';
        console.error(`Storage Upload Error to path ${destinationPath}:`, message);
        // Re-throw a more specific error to be caught by server actions
        throw new Error(`Failed to upload file to Supabase Storage: ${message}`);
    }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath The path of the file to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteFromStorage(filePath: string): Promise<boolean> {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
        throw new Error('Supabase client is not initialized.');
    }

    try {
        const { error } = await supabase.storage
            .remove([filePath]);

        if (error) {
            console.error(`Error deleting file ${filePath}:`, error);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Storage Delete Error for path ${filePath}:`, error);
        return false;
    }
}

/**
 * Get a signed URL for temporary access to a private file
 * @param {string} filePath The path of the file
 * @param {number} expiresIn Seconds until the URL expires (default: 3600 = 1 hour)
 * @returns {Promise<string>} Signed URL for temporary access
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
        throw new Error('Supabase client is not initialized.');
    }

    try {
        const { data, error } = await supabase.storage
            .from('character-images')
            .createSignedUrl(filePath, expiresIn);

        if (error) {
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return data.signedUrl;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`Signed URL Error for path ${filePath}:`, message);
        throw new Error(`Failed to create signed URL: ${message}`);
    }
}
