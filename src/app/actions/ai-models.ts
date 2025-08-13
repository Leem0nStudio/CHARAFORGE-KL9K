
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { UpsertModelSchema, type UpsertAiModel } from '@/types/ai-model';
import { suggestHfModel } from '@/ai/flows/hf-model-suggestion/flow';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function getCivitaiModelInfo(modelId: string): Promise<any> {
    const url = `https://civitai.com/api/v1/models/${modelId}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        let errorBody = `Status: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorBody += ` ${errorJson.error || JSON.stringify(errorJson)}`;
        } catch(e) {
             errorBody += ` ${response.statusText}`;
        }
        throw new Error(`Failed to fetch model info from Civitai. ${errorBody}`);
    }
    return response.json();
}

export async function upsertModel(data: UpsertAiModel): Promise<ActionResponse> {
    await verifyAndGetUid();
    const validation = UpsertModelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }
    const { id, ...modelData } = validation.data;

    try {
        const docRef = id ? adminDb.collection('ai_models').doc(id) : adminDb.collection('ai_models').doc();
        
        const finalData = {
            ...modelData,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (id) {
            await docRef.update(finalData);
        } else {
            await docRef.set({ 
                ...finalData, 
                id: docRef.id,
                createdAt: FieldValue.serverTimestamp()
            });
        }
        
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        
        return { success: true, message: `Model "${modelData.name}" saved successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function addAiModelFromCivitai(type: 'model' | 'lora', civitaiModelId: string): Promise<ActionResponse> {
    await verifyAndGetUid();
    
    try {
        const modelInfo = await getCivitaiModelInfo(civitaiModelId);
        const latestVersion = modelInfo.modelVersions?.[0];
        
        let coverMediaUrl: string | null = null;
        let coverMediaType: 'image' | 'video' = 'image';
        
        const getMediaInfo = (image: any) => {
             if (image?.url) {
                if (image.type === 'video' || image.meta?.video) {
                    const videoUrl = image.meta?.video?.url || image.url;
                    if (videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('octet-stream'))) {
                       return { url: videoUrl, type: 'video' as 'video' };
                    }
                }
                return { url: image.url, type: 'image' as 'image' };
            }
            return null;
        };

        const mediaItems = latestVersion?.images?.length > 0 ? latestVersion.images : modelInfo.images;
        const mediaInfo = mediaItems?.[0] ? getMediaInfo(mediaItems[0]) : null;

        if (mediaInfo) {
            coverMediaUrl = mediaInfo.url;
            coverMediaType = mediaInfo.type;
        }

        let suggestedHfId = '';
        if (type === 'lora') {
            const suggestion = await suggestHfModel({ modelName: modelInfo.name });
            suggestedHfId = suggestion.suggestedHfId;
        } else if (type === 'model') {
            suggestedHfId = modelInfo.name.toLowerCase().includes('sdxl') ? 'stabilityai/stable-diffusion-xl-base-1.0' : '';
        }
        
        // Combine official trigger words with descriptive tags for richer prompts
        const combinedTriggerWords = [
            ...(latestVersion?.trainedWords || []),
            ...(modelInfo.tags || [])
        ];
        // Remove duplicates
        const triggerWords = [...new Set(combinedTriggerWords)];


        const newModel: Omit<AiModel, 'id' | 'createdAt' | 'updatedAt'> = {
            name: modelInfo.name,
            civitaiModelId: modelInfo.id.toString(),
            type,
            engine: type === 'model' ? 'huggingface' : 'huggingface',
            hf_id: suggestedHfId,
            versionId: latestVersion?.id?.toString() || '',
            coverMediaUrl,
            coverMediaType,
            triggerWords: triggerWords,
            versions: modelInfo.modelVersions.map((v: any) => ({ 
                id: v.id.toString(), 
                name: v.name, 
                triggerWords: [...new Set([...(v.trainedWords || []), ...(modelInfo.tags || [])])]
            })),
        };
        
        const docRef = adminDb.collection('ai_models').doc();
        await docRef.set({
            ...newModel,
            id: docRef.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        
        return { success: true, message: `Model "${newModel.name}" added successfully.` };
    
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Operation failed.", error: message };
    }
}


export async function getModels(type: 'model' | 'lora'): Promise<AiModel[]> {
    if (!adminDb) return [];
    try {
        const snapshot = await adminDb.collection('ai_models')
            .where('type', '==', type)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            } as AiModel;
        });
    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        return [];
    }
}


export async function deleteModel(id: string): Promise<ActionResponse> {
    await verifyAndGetUid();
    if (!adminDb) return { success: false, message: 'Database service is unavailable.' };
    
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
