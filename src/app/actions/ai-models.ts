
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { suggestHfModel } from '@/ai/flows/hf-model-suggestion/flow';
import { z } from 'zod';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const AddModelSchema = z.object({
  civitaiModelId: z.string().min(1, 'Civitai Model ID is required.'),
});
export type AddModelFormValues = z.infer<typeof AddModelSchema>;


/**
 * Fetches model information from the Civitai API.
 * @param modelId The Civitai model ID.
 * @returns A promise that resolves to the model's metadata.
 */
async function getCivitaiModelInfo(modelId: string): Promise<any> {
    const response = await fetch(`https://civitai.com/api/v1/models/${modelId}`);
    if (!response.ok) {
        let errorBody = `Status: ${response.status}`;
        try {
            const errorJson = await response.json();
            const errorMessage = errorJson.error || JSON.stringify(errorJson);
            errorBody = errorMessage;
        } catch(e) { /* ignore if parsing fails */ }
        throw new Error(`Failed to fetch model info from Civitai for ${modelId}. ${errorBody}`);
    }
    return response.json();
}

/**
 * Adds a new model by fetching its metadata from Civitai and automatically suggesting a compatible Hugging Face base model.
 * @param type The designated type of the model ('model' or 'lora').
 * @param values The form values containing the civitaiModelId.
 */
export async function addAiModelFromCivitai(type: 'model' | 'lora', values: AddModelFormValues): Promise<ActionResponse> {
    try {
        await verifyAndGetUid();
    } catch(authError) {
         return { success: false, message: 'Authentication failed.', error: authError instanceof Error ? authError.message : 'Unknown auth error.' };
    }

    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    
    const validation = AddModelSchema.safeParse(values);
     if (!validation.success) {
        const firstError = validation.error.errors[0];
        return { success: false, message: `Invalid input: ${firstError.message}` };
    }
    const { civitaiModelId } = validation.data;

    try {
        const modelInfo = await getCivitaiModelInfo(civitaiModelId);
        const latestVersion = modelInfo.modelVersions?.[0];

        let coverImageUrl = null;
        if (latestVersion?.images?.[0]?.url) {
            coverImageUrl = latestVersion.images[0].url;
        } else if (modelInfo.images?.[0]?.url) {
            coverImageUrl = modelInfo.images[0].url;
        }

        let suggestedHfId = '';
        if (type === 'lora') {
            try {
                const suggestionResult = await suggestHfModel({ modelName: modelInfo.name });
                suggestedHfId = suggestionResult.suggestedHfId;
            } catch (suggestionError) {
                console.warn(`Could not automatically suggest a base model for ${modelInfo.name}:`, suggestionError);
            }
        }

        const newModel: Omit<AiModel, 'id' | 'createdAt'> = {
            name: modelInfo.name,
            civitaiModelId: modelInfo.id.toString(),
            versionId: latestVersion?.id?.toString() || '',
            type: type,
            hf_id: suggestedHfId,
            coverImageUrl: coverImageUrl,
            triggerWords: latestVersion?.trainedWords || [],
        };
        
        const docRef = adminDb.collection('ai_models').doc();
        await docRef.set({
            ...newModel,
            id: docRef.id,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        
        return { success: true, message: `Model "${newModel.name}" added successfully.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to add model.', error: message };
    }
}

/**
 * Fetches a list of models or LoRAs from the Firestore database.
 * @param type The type of model to fetch ('model' or 'lora').
 * @returns A promise that resolves to an array of AiModel objects.
 */
export async function getModels(type: 'model' | 'lora'): Promise<AiModel[]> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return [];
    }
    try {
        const snapshot = await adminDb.collection('ai_models')
            .where('type', '==', type)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
        } as AiModel));

    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        return [];
    }
}


/**
 * Updates an existing model, specifically its Hugging Face execution ID.
 * @param id The Firestore document ID of the model to update.
 * @param hf_id The new Hugging Face/Gradio identifier.
 */
export async function updateModelHfId(id: string, hf_id: string): Promise<ActionResponse> {
    try {
        await verifyAndGetUid();
    } catch(authError) {
         return { success: false, message: 'Authentication failed.', error: authError instanceof Error ? authError.message : 'Unknown auth error.' };
    }
     if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }
    try {
        await adminDb.collection('ai_models').doc(id).update({ hf_id });
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        return { success: true, message: 'Model execution ID updated.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to update model.', error: message };
    }
}


/**
 * Deletes a model or LoRA from the database.
 * @param id The Firestore document ID of the model to delete.
 */
export async function deleteModel(id: string): Promise<ActionResponse> {
    try {
        await verifyAndGetUid();
    } catch(authError) {
         return { success: false, message: 'Authentication failed.', error: authError instanceof Error ? authError.message : 'Unknown auth error.' };
    }

    if (!adminDb) {
        return { success: false, message: 'Database service is unavailable.' };
    }

    try {
        await adminDb.collection('ai_models').doc(id).delete();
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        return { success: true, message: 'Model deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete model.', error: message };
    }
}
