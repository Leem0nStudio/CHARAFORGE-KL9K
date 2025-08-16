
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { UpsertModelSchema, type UpsertAiModel } from '@/types/ai-model';
import { suggestHfModel } from '@/ai/flows/hf-model-suggestion/flow';
import { uploadToStorage } from '@/services/storage';
import { imageModels, textModels } from '@/lib/app-config';

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
        
        const combinedTriggerWords = [
            ...(latestVersion?.trainedWords || []),
            ...(modelInfo.tags || [])
        ];
        const triggerWords = [...new Set(combinedTriggerWords)];


        const newModel: Omit<AiModel, 'id' | 'createdAt' | 'updatedAt'> = {
            name: modelInfo.name,
            civitaiModelId: modelInfo.id.toString(),
            type,
            engine: 'huggingface', 
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

/**
 * Fetches the models available to a specific user.
 * This includes system-wide models and the user's own custom models.
 * @param uid The user's ID.
 * @param type The type of model ('model' or 'lora').
 * @returns A promise that resolves to an array of AiModel objects.
 */
async function fetchUserAndSystemModels(uid: string, type: 'model' | 'lora'): Promise<AiModel[]> {
    if (!adminDb) return [];
    
    // Fetch system models (no userId) and user-specific models concurrently.
    const [systemModelsSnapshot, userModelsSnapshot] = await Promise.all([
        adminDb.collection('ai_models')
            .where('type', '==', type)
            .where('userId', '==', null)
            .orderBy('createdAt', 'desc')
            .get(),
        adminDb.collection('ai_models')
            .where('type', '==', type)
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get()
    ]);

    const allModels = new Map<string, AiModel>();

    const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>) => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const model: AiModel = {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            } as AiModel;
            if (!allModels.has(model.id)) {
                allModels.set(model.id, model);
            }
        });
    };

    processSnapshot(systemModelsSnapshot);
    processSnapshot(userModelsSnapshot);
    
    return Array.from(allModels.values());
}


export async function upsertUserAiModel(formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    
    // Extract data from FormData
    const rawData = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        type: formData.get('type'),
        engine: 'huggingface', // Hardcoded as user models are currently only this type
        hf_id: formData.get('hf_id'),
        triggerWords: formData.get('triggerWords'),
        // coverMediaUrl is handled separately
    };

    const validation = UpsertModelSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }

    const { id, ...modelData } = validation.data;
    const isNew = !id;
    const coverImageFile = formData.get('coverImage') as File | null;

    try {
        const docRef = isNew ? adminDb.collection('ai_models').doc() : adminDb.collection('ai_models').doc(id);

        if (!isNew) {
            const existingDoc = await docRef.get();
            if (!existingDoc.exists || existingDoc.data()?.userId !== uid) {
                return { success: false, message: "Permission denied or model not found." };
            }
        }
        
        let coverMediaUrl = modelData.coverMediaUrl || null;
        if (coverImageFile && coverImageFile.size > 0) {
            const destinationPath = `usersImg/${uid}/ai_models/${docRef.id}/cover.png`;
            // uploadToStorage can handle File objects directly now.
            coverMediaUrl = await uploadToStorage(coverImageFile, destinationPath);
        }

        const finalData = {
            ...modelData,
            userId: uid,
            coverMediaUrl,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (isNew) {
            await docRef.set({ 
                ...finalData, 
                id: docRef.id,
                createdAt: FieldValue.serverTimestamp()
            });
        } else {
            await docRef.update(finalData);
        }
        
        revalidatePath('/profile');
        
        return { success: true, message: `Model "${modelData.name}" saved successfully.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}



export async function deleteModel(id: string): Promise<ActionResponse> {
    await verifyAndGetUid();
    if (!adminDb) return { success: false, message: 'Database service is unavailable.' };
    
    try {
        await adminDb.collection('ai_models').doc(id).delete();
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        revalidatePath('/profile');
        return { success: true, message: 'Model deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete model.', error: message };
    }
}


/**
 * Fetches all models of a given type ('model' or 'lora') from the database.
 * This is intended for admin use or for populating selectors.
 * It fetches models without a userId (system models) and user-specific models.
 * @param type The type of model to fetch.
 * @returns An array of AiModel objects.
 */
export async function getModels(type: 'model' | 'lora'): Promise<AiModel[]> {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb
      .collection('ai_models')
      .where('type', '==', type)
      .orderBy('createdAt', 'desc')
      .get();
      
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
    console.error(`Error fetching all ${type}s:`, error);
    return [];
  }
}

export async function getModelsForUser(type: 'model' | 'lora'): Promise<AiModel[]> {
    const uid = await verifyAndGetUid();
    if (!adminDb) return [];
    
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const installedModelIds = userDoc.data()?.stats?.installedModels || [];

        const [userModels, systemModels] = await Promise.all([
            // Get models the user created
             adminDb.collection('ai_models').where('userId', '==', uid).where('type', '==', type).get(),
            // Get system models they have installed
            installedModelIds.length > 0 
                ? adminDb.collection('ai_models').where('id', 'in', installedModelIds).where('type', '==', type).get()
                : Promise.resolve(null),
        ]);

        const allModels = new Map<string, AiModel>();

        const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot | null) => {
            snapshot?.docs.forEach(doc => {
                const data = doc.data();
                const model = {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                } as AiModel;
                if (!allModels.has(model.id)) {
                    allModels.set(model.id, model);
                }
            });
        };
        
        processSnapshot(userModels);
        processSnapshot(systemModels);

        const staticModels = type === 'model' ? imageModels : [];

        for (const model of staticModels) {
             if (!allModels.has(model.id)) {
                allModels.set(model.id, model);
            }
        }

        return Array.from(allModels.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error("Error fetching models for user:", error);
        return [];
    }
}


export async function installModel(modelId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    if (!adminDb) return { success: false, message: "Database service is not available."};

    try {
        const userRef = adminDb.collection('users').doc(uid);
        const modelRef = adminDb.collection('ai_models').doc(modelId);

        const [userDoc, modelDoc] = await Promise.all([userRef.get(), modelRef.get()]);

        if (!modelDoc.exists) {
            return { success: false, message: "This model does not exist." };
        }
        if (modelDoc.data()?.userId) {
            return { success: false, message: "Cannot install a user-specific model." };
        }

        const installedModels = userDoc.data()?.stats?.installedModels || [];
        if (installedModels.includes(modelId)) {
            return { success: false, message: "You have already installed this model." };
        }

        await userRef.set({
            stats: {
                installedModels: FieldValue.arrayUnion(modelId),
            },
        }, { merge: true });

        revalidatePath('/profile');
        revalidatePath('/models');

        return { success: true, message: "Model successfully installed!" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Install Model Error:", message);
        return { success: false, message: "Failed to install model." };
    }
}
