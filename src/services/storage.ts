
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * A centralized, robust function to upload a file to Supabase Storage.
 * It can handle both File objects (from form data) and Buffers (from AI generation).
 * It now accepts an optional Supabase client instance to be usable from different environments.
 * 
 * @param {File | Buffer | ArrayBuffer | string} fileSource The source of the file (File, Buffer, ArrayBuffer, or a base64 data URI).
 * @param {string} destinationPath The desired path within the bucket (e.g., 'avatars/userId').
 * @param {SupabaseClient} [supabaseClient] - Optional Supabase client instance. If not provided, it will create one for server-side context.
 * @returns {Promise<string>} A promise that resolves to the public URL of the uploaded file.
 * @throws {Error} Throws an error if the upload fails.
 */
export async function uploadToStorage(
    fileSource: File | Buffer | ArrayBuffer | string,
    destinationPath: string,
    supabaseClient?: SupabaseClient
): Promise<string> {
    const supabase = supabaseClient || await getSupabaseServerClient();
    if (!supabase) {
        throw new Error("Storage service is not available. Supabase client failed to initialize.");
    }

    const bucketName = 'chara-images';
    const filePath = destinationPath;

    let fileData: File | Buffer | ArrayBuffer;
    let contentType: string | undefined;

    if (typeof fileSource === 'string' && fileSource.startsWith('data:')) {
        const match = fileSource.match(/^data:(image\/\w+|audio\/\w+);base64,(.+)$/);
        if (!match) throw new Error('Invalid Data URI format.');
        contentType = match[1];
        fileData = Buffer.from(match[2], 'base64');
    } else {
        fileData = fileSource;
        if (fileSource instanceof File) {
            contentType = fileSource.type;
        }
    }
    
    if (!contentType) {
        contentType = 'application/octet-stream'; // Default content type if it cannot be determined
    }
    
    try {
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileData, {
                contentType,
                upsert: true, // Overwrite file if it exists, useful for avatars
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Failed to get public URL for the uploaded file.');
        }
        
        return data.publicUrl;

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown storage error occurred.';
        console.error(`Supabase Storage Upload Error for path ${destinationPath}:`, message);
        throw new Error(`Failed to upload file to Supabase Storage: ${message}`);
    }
}
