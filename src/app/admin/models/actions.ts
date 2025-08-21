
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

/**
 * Queues a model to be synced by an external worker.
 * This function validates that the necessary API keys and storage buckets are configured
 * and then updates the model's document in Firestore to a 'syncing' status.
 * This allows a long-running process (like a Kaggle notebook) to pick up the job.
 * @param modelId The ID of the model to queue for synchronization.
 * @returns A promise that resolves to an ActionResponse.
 */
export async function syncModelToStorage(modelId: string): Promise<ActionResponse> {
    await verifyAndGetUid(); 
    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    const modelRef = adminDb.collection('ai_models').doc(modelId);

    try {
        // This action now only checks for configuration and schedules the job.
        const civitaiApiKey = process.env.CIVITAI_API_KEY;
        if (!civitaiApiKey) {
            return { success: false, message: 'Civitai API key is not configured on the server. Please add it to your .env file.' };
        }
        
        const modelsBucketName = process.env.MODELS_STORAGE_BUCKET;
        if (!modelsBucketName) {
            return { success: false, message: 'The MODELS_STORAGE_BUCKET environment variable is not set. Cannot sync models.'};
        }

        const modelDoc = await modelRef.get();
        if (!modelDoc.exists) {
            return { success: false, message: 'Model not found in database.' };
        }
        const model = modelDoc.data();

        if (!model?.civitaiModelId || !model?.versionId) {
            return { success: false, message: 'Model does not have a Civitai model or version ID set.' };
        }

        // Set status to 'syncing' to signal the external worker to pick it up.
        await modelRef.update({ syncStatus: 'syncing' });
        revalidatePath('/admin/models');
        
        return { success: true, message: `Model "${model.name}" has been queued for synchronization.` };

    } catch (error) {
        // If anything fails during the scheduling, reset the status.
        await modelRef.update({ syncStatus: 'notsynced' }).catch(() => {});
        revalidatePath('/admin/models');
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Failed to queue sync job.', error: message };
    }
}
