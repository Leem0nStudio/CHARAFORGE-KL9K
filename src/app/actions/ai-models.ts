

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
    data?: Partial<AiModel>; // Used to return pre-filled data
};

// Source-specific API fetchers
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

async function getModelsLabModelInfo(modelIdOrSlug: string): Promise<any> {
    const apiKey = process.env.MODELSLAB_API_KEY;
    if (!apiKey) {
        throw new Error("ModelsLab API key is not configured on the server. Please add MODELSLAB_API_KEY to your .env file.");
    }
    const url = `https://modelslab.com/api/v6/model/${modelIdOrSlug}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        },
        cache: 'no-store'
    });
    if (!response.ok) {
        let errorBody = `Status: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorBody += ` ${errorJson.detail || JSON.stringify(errorJson)}`;
        } catch(e) {
             errorBody += ` ${response.statusText}`;
        }
        throw new Error(`Could not find a model on ModelsLab matching the identifier: "${modelIdOrSlug}". ${errorBody}`);
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
        
        const finalData: Omit<AiModel, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { updatedAt: FieldValue, userId?: string | null } = {
            ...modelData,
            updatedAt: FieldValue.serverTimestamp(),
            // This field should not be present for system models
            userId: null,
        };
        
        if (id) {
            await docRef.update(finalData as any);
        } else {
            await docRef.set({ 
                ...finalData, 
                id: docRef.id,
                createdAt: FieldValue.serverTimestamp(),
                syncStatus: 'notsynced',
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


export async function addAiModelFromSource(source: 'civitai' | 'modelslab', sourceModelId: string): Promise<ActionResponse> {
    await verifyAndGetUid();
    
    try {
        const existingModelQuery = await adminDb.collection('ai_models')
            .where(`${source}ModelId`, '==', sourceModelId)
            .limit(1).get();
        if (!existingModelQuery.empty) {
            return { success: false, message: `A model with this ${source} ID already exists.` };
        }
        
        let modelInfo;
        if (source === 'modelslab') {
            modelInfo = await getModelsLabModelInfo(sourceModelId);
        } else {
            modelInfo = await getCivitaiModelInfo(sourceModelId);
        }
        
        const modelVersions = modelInfo.model_versions || modelInfo.modelVersions || modelInfo.versions;
        // **NEW LOGIC**: Don't fail if versions are missing. Proceed with what we have.
        const latestVersion = (modelVersions && modelVersions.length > 0) ? modelVersions[0] : {};

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

        let engine: AiModel['engine'] = source === 'modelslab' ? 'modelslab' : 'huggingface';
        let suggestedHfId = '';
        const baseModelName = latestVersion.baseModel;

        if (baseModelName && engine === 'huggingface') {
            const baseModelQuery = await adminDb.collection('ai_models')
                .where('type', '==', 'model')
                .where('baseModel', '==', baseModelName)
                .limit(1)
                .get();

            if (!baseModelQuery.empty) {
                const baseModel = baseModelQuery.docs[0].data() as AiModel;
                suggestedHfId = baseModel.hf_id; 
                engine = baseModel.engine;
                console.log(`Found compatible base model '${baseModel.name}'. Engine: ${engine}, Execution_ID: ${suggestedHfId}`);
            } else {
                const suggestion = await suggestHfModel({ modelName: modelInfo.name });
                suggestedHfId = suggestion.suggestedHfId;
            }
        }
        
        const combinedTriggerWords = [
            ...(latestVersion?.trainedWords || []),
            ...(modelInfo.tags || [])
        ];
        const triggerWords = [...new Set(combinedTriggerWords)];

        const prefilledData: Partial<AiModel> = {
            name: modelInfo.name || modelInfo.model_name,
            civitaiModelId: source === 'civitai' ? modelInfo.id.toString() : undefined,
            modelslabModelId: source === 'modelslab' ? (modelInfo.model_id || modelInfo.id).toString() : undefined,
            hf_id: source === 'modelslab' ? (modelInfo.model_id || modelInfo.id).toString() : suggestedHfId,
            type: modelInfo.type.toLowerCase() === 'lora' ? 'lora' : 'model',
            engine: engine, 
            versionId: latestVersion?.id?.toString() || '',
            baseModel: baseModelName,
            coverMediaUrl,
            triggerWords: triggerWords,
            // We don't return versions if they are empty, let the user add manually if needed.
            versions: modelVersions?.length > 0 ? modelVersions.map((v: any) => ({ 
                id: v.id.toString(), 
                name: v.name, 
                baseModel: v.baseModel,
                triggerWords: [...new Set([...(v.trainedWords || []), ...(modelInfo.tags || [])])]
            })) : [],
        };
        
        // **NEW LOGIC**: Instead of saving, return the data to pre-fill the form.
        return {
            success: true,
            message: "Model data fetched successfully. Please review and save manually.",
            data: prefilledData
        };
    
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Operation failed.", error: message };
    }
}



export async function upsertUserAiModel(formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    
    const rawData: Record<string, any> = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        type: formData.get('type'),
        engine: formData.get('engine'),
        triggerWords: formData.get('triggerWords'),
    };
    
    // Add engine-specific IDs
    if (rawData.engine === 'huggingface') {
        rawData.hf_id = formData.get('hf_id');
    } else if (rawData.engine === 'modelslab') {
        rawData.modelslabModelId = formData.get('modelslabModelId');
        rawData.hf_id = formData.get('modelslabModelId');
    }

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


export async function getModels(type: 'model' | 'lora', uid?: string): Promise<AiModel[]> {
    if (!adminDb) return [];
    
    const allModels = new Map<string, AiModel>();

    const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot) => {
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

    try {
        // System models are always available to everyone
        const systemModelsSnapshot = await adminDb
          .collection('ai_models')
          .where('type', '==', type)
          .where('userId', '==', null)
          .orderBy('createdAt', 'desc')
          .get();
        processSnapshot(systemModelsSnapshot);

        // If a user is logged in, fetch their specific models
        if (uid) {
            const userModelsSnapshot = await adminDb
                .collection('ai_models')
                .where('userId', '==', uid)
                .where('type', '==', type)
                .orderBy('createdAt', 'desc')
                .get();
            processSnapshot(userModelsSnapshot);
        }

        // Add static (hardcoded) models
        const staticModels = type === 'model' ? imageModels : [];
        staticModels.forEach(model => {
            if (!allModels.has(model.id)) {
                allModels.set(model.id, model);
            }
        });

        return Array.from(allModels.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
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
    
