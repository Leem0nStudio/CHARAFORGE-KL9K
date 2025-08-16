
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function getCivitaiModelVersionInfo(versionId: string): Promise<any> {
    const url = `https://civitai.com/api/v1/model-versions/${versionId}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch model version info from Civitai. Status: ${response.status}`);
    }
    return response.json();
}

export async function syncModelToStorage(modelId: string): Promise<ActionResponse> {
    await verifyAndGetUid(); 
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    const modelRef = adminDb.collection('ai_models').doc(modelId);

    try {
        const civitaiApiKey = process.env.CIVITAI_API_KEY;
        if (!civitaiApiKey) {
            return { success: false, message: 'Civitai API key is not configured on the server. Please add it to your .env file.' };
        }

        const modelDoc = await modelRef.get();
        if (!modelDoc.exists) {
            return { success: false, message: 'Model not found in database.' };
        }
        const model = modelDoc.data() as AiModel;

        if (!model.civitaiModelId || !model.versionId) {
            return { success: false, message: 'Model does not have a Civitai model or version ID set.' };
        }

        await modelRef.update({ syncStatus: 'syncing' });
        revalidatePath('/admin/models');
        
        const versionInfo = await getCivitaiModelVersionInfo(model.versionId);
        const primaryFile = versionInfo?.files?.[0];
        
        if (!primaryFile?.downloadUrl) {
            await modelRef.update({ syncStatus: 'notsynced' });
            return { success: false, message: 'Could not find a download URL for this model version.' };
        }

        let downloadUrl = `${primaryFile.downloadUrl}?token=${civitaiApiKey}`;
        
        const fileName = primaryFile.name;
        
        const modelTypeFolder = model.type === 'model' ? 'Models' : 'LoRas';
        const destinationPath = `SDXL/${modelTypeFolder}/${fileName}`;
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(downloadUrl);

        if (!response.ok || !response.body) {
             const errorText = await response.text();
             console.error("Civitai Download Error:", errorText);
             throw new Error(`Failed to download model from Civitai: ${response.statusText}`);
        }
        
        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(destinationPath);
        const stream = file.createWriteStream({
            metadata: {
                contentType: primaryFile.metadata?.format === 'safetensors' ? 'application/octet-stream' : undefined,
            },
        });
        
        await finished(Readable.from(response.body).pipe(stream));

        await modelRef.update({ syncStatus: 'synced' });
        revalidatePath('/admin/models');
        
        return { success: true, message: `Model "${model.name}" successfully synced to your storage.` };

    } catch (error) {
        await modelRef.update({ syncStatus: 'notsynced' });
        revalidatePath('/admin/models');
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Sync failed.', error: message };
    }
}
