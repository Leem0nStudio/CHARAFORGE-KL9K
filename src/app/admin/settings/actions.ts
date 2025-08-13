
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { verifyAndGetUid } from '@/lib/auth/server';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const LOGO_PATH = 'app-assets/logo.png';

export async function updateLogo(prevState: any, formData: FormData): Promise<ActionResponse> {
    try {
        await verifyAndGetUid();

        const logoFile = formData.get('logo') as File;

        if (!logoFile || logoFile.size === 0) {
            return { success: false, message: 'No file was uploaded. Please select a logo.' };
        }
        if (logoFile.type !== 'image/png') {
            return { success: false, message: 'Invalid file type. Please upload a PNG image.' };
        }

        if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
            throw new Error("Storage bucket not configured.");
        }
        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(LOGO_PATH);

        const buffer = Buffer.from(await logoFile.arrayBuffer());

        await file.save(buffer, {
            metadata: { 
                contentType: 'image/png',
                cacheControl: 'no-cache, max-age=0',
            },
            public: true, 
        });
        
        const publicUrl = file.publicUrl();

        if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }
        await adminDb.collection('settings').doc('appDetails').set({
            logoUrl: publicUrl,
        }, { merge: true });
        
        revalidatePath('/', 'layout');

        return { success: true, message: 'Logo updated successfully!' };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Update Logo Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}

    