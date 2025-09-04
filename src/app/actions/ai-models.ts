'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid, verifyIsAdmin } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { UpsertModelSchema, type UpsertAiModel } from '@/types/ai-model';
import { suggestHfModel } from '@/ai/flows/hf-model-suggestion/flow';
import { uploadToStorage } from '@/services/storage';
import { imageModels } from '@/lib/app-config';
import { getCivitaiModelInfo, getModelsLabModelInfo } from './source-fetchers';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    data?: Partial<AiModel>; // Used to return pre-filled data
};

const toAiModelObject = (row: Record<string, any>): AiModel => ({
    id: row.id,
    name: row.name,
    type: row.type,
    engine: row.engine,
    hf_id: row.hf_id,
    civitaiModelId: row.civitai_model_id,
    modelslabModelId: row.modelslab_model_id,
    versionId: row.version_id,
    baseModel: row.base_model,
    coverMediaUrl: row.cover_media_url,
    coverMediaType: row.cover_media_type,
    triggerWords: row.trigger_words,
    versions: row.versions_data,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userId: row.user_id,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
    gcsUri: row.gcs_uri,
    vertexAiAlias: row.vertex_ai_alias,
    apiUrl: row.api_url,
    comfyWorkflow: row.comfy_workflow,
    mixRecipe: row.mix_recipe,
});

export async function upsertModel(data: UpsertAiModel): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    const validation = UpsertModelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }
    const { id, ...modelData } = validation.data;

    try {
        const dataToUpsert = {
            id: id,
            name: modelData.name,
            type: modelData.type,
            engine: modelData.engine,
            hf_id: modelData.hf_id,
            civitai_model_id: modelData.civitaiModelId,
            modelslab_model_id: modelData.modelslabModelId,
            version_id: modelData.versionId,
            base_model: modelData.baseModel,
            trigger_words: modelData.triggerWords,
            vertex_ai_alias: modelData.vertexAiAlias,
            api_url: modelData.apiUrl,
            comfy_workflow: modelData.comfyWorkflow,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('ai_models').upsert(dataToUpsert);
        if (error) throw error;
        
        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        
        return { success: true, message: `Model "${modelData.name}" saved successfully.` };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function addAiModelFromSource(source: 'civitai' | 'modelslab', sourceModelId: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    try {
        const { data: existingModel, error: fetchError } = await supabase
            .from('ai_models')
            .select('id')
            .or(`civitai_model_id.eq.${sourceModelId},modelslab_model_id.eq.${sourceModelId}`)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (existingModel) {
            return { success: false, message: `A model with this ${source} ID already exists.` };
        }
        
        let modelInfo;
        if (source === 'modelslab') {
            modelInfo = await getModelsLabModelInfo(sourceModelId);
        } else {
            modelInfo = await getCivitaiModelInfo(sourceModelId);
        }
        
        const modelVersions = modelInfo.modelVersions || modelInfo.versions;
        if (!modelVersions || modelVersions.length === 0) {
            return {
                success: false,
                message: "Model found, but no version data is available via API. Please add it manually.",
            };
        }
        
        const latestVersion = modelVersions[0];

        let coverMediaUrl: string | null = null;
        let coverMediaType: 'image' | 'video' = 'image';
        
        interface CivitaiImage {
            url: string;
            type: string;
            meta?: { video?: { url: string; }; };
        }

        const getMediaInfo = (image: CivitaiImage) => {
            if (image?.url) {
                if (image.type === 'video' || image.meta?.video) {
                    const videoUrl = image.meta?.video?.url || image.url;
                    if (videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('octet-stream'))) {
                       return { url: videoUrl, type: 'video' as const };
                    }
                }
                return { url: image.url, type: 'image' as const };
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
            const { data: baseModelData } = await supabase.from('ai_models')
                .select('*')
                .eq('type', 'model')
                .eq('base_model', baseModelName)
                .maybeSingle();

            if (baseModelData) {
                const baseModel = toAiModelObject(baseModelData);
                suggestedHfId = baseModel.hf_id; 
                engine = baseModel.engine;
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
            modelslabModelId: source === 'modelslab' ? (modelInfo.model_id || sourceModelId).toString() : undefined,
            hf_id: source === 'modelslab' ? (modelInfo.model_id || sourceModelId).toString() : suggestedHfId,
            type: modelInfo.type.toLowerCase() === 'lora' ? 'lora' : 'model',
            engine: engine, 
            versionId: latestVersion?.id?.toString() || '',
            baseModel: baseModelName,
            coverMediaUrl,
            coverMediaType,
            triggerWords: triggerWords,
            versions: modelVersions?.map((v: { id: { toString: () => any; }; name: any; baseModel: any; trainedWords: any[]; }) => ({ 
                id: v.id.toString(), 
                name: v.name, 
                baseModel: v.baseModel,
                triggerWords: [...new Set([...(v.trainedWords || []), ...(modelInfo.tags || [])])]
            })) || [],
        };
        
        return {
            success: true,
            message: "Model data fetched successfully. Please review and save manually.",
            data: prefilledData
        };
    
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Operation failed.", error: message };
    }
}

export async function upsertUserAiModel(formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    const rawData = Object.fromEntries(formData.entries());
    
    const validation = UpsertModelSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }

    const { id, ...modelData } = validation.data;
    const isNew = !id;
    const coverImageFile = formData.get('coverImage') as File | null;
    const newId = isNew ? (await import('uuid')).v4() : id;

    try {
        if (!isNew) {
            const { data: existingDoc, error: permError } = await supabase.from('ai_models').select('user_id').eq('id', id).single();
            if (permError || !existingDoc || existingDoc.user_id !== uid) {
                return { success: false, message: "Permission denied or model not found." };
            }
        }
        
        let coverMediaUrl = modelData.coverMediaUrl || null;
        if (coverImageFile && coverImageFile.size > 0) {
            const destinationPath = `usersImg/${uid}/ai_models/${newId}/cover.png`;
            coverMediaUrl = await uploadToStorage(coverImageFile, destinationPath);
        }
        
        const { error } = await supabase.from('ai_models').upsert({
            id: newId,
            user_id: uid,
            name: modelData.name,
            type: modelData.type,
            engine: modelData.engine,
            hf_id: modelData.hf_id,
            modelslab_model_id: modelData.modelslabModelId,
            trigger_words: modelData.triggerWords,
            cover_media_url: coverMediaUrl,
            updated_at: new Date().toISOString(),
        });
        
        if (error) throw error;
        
        revalidatePath('/profile/models');
        
        return { success: true, message: `Model "${modelData.name}" saved successfully.` };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}



export async function deleteModel(id: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    try {
        const { data, error: fetchError } = await supabase.from('ai_models').select('user_id').eq('id', id).single();
        if(fetchError) throw fetchError;
        
        const isSystemModel = !data.user_id;
        const isOwner = data.user_id === uid;
        
        if (!isOwner && !isSystemModel) {
            return { success: false, message: 'Permission denied.' };
        }
        if (isSystemModel) {
            await verifyIsAdmin();
        }

        await supabase.from('ai_models').delete().eq('id', id);

        revalidatePath('/admin/models');
        revalidatePath('/character-generator');
        revalidatePath('/profile');
        return { success: true, message: 'Model deleted successfully.' };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete model.', error: message };
    }
}


export async function getModels(type: 'model' | 'lora', uid?: string): Promise<AiModel[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    
    const allModels = new Map<string, AiModel>();
    const staticModels = type === 'model' ? imageModels : [];
    staticModels.forEach(model => allModels.set(model.id, model));

    try {
        const query = supabase.from('ai_models').select('*').eq('type', type);
        
        const { data: dbModels, error } = await query;
        if(error) throw error;

        dbModels.forEach(row => {
            const model = toAiModelObject(row);
            if (!allModels.has(model.id) && (!model.userId || model.userId === uid)) {
                 allModels.set(model.id, model);
            }
        });
        
        return Array.from(allModels.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error: unknown) {
        console.error(`Error fetching ${type}s:`, error);
        return Array.from(allModels.values());
    }
}


export async function installModel(modelId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };

    try {
        const { data: modelData, error: modelError } = await supabase.from('ai_models').select('user_id, name').eq('id', modelId).single();
        if (modelError || !modelData) return { success: false, message: "This model does not exist." };
        if (modelData.user_id) return { success: false, message: "Cannot install a user-specific model." };
        
        const { data: userData, error: userError } = await supabase.from('users').select('preferences').eq('id', uid).single();
        if (userError) throw userError;

        const installedModels = userData.preferences?.installed_models || [];
        if (installedModels.includes(modelId)) {
            return { success: false, message: "You have already installed this model." };
        }
        
        const newInstalledModels = [...installedModels, modelId];
        const { error: updateError } = await supabase
            .from('users')
            .update({ preferences: { ...userData.preferences, installed_models: newInstalledModels } })
            .eq('id', uid);
        
        if (updateError) throw updateError;
        
        revalidatePath('/profile/models');
        revalidatePath('/models');

        return { success: true, message: "Model successfully installed!" };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Install Model Error:", message);
        return { success: false, message: "Failed to install model." };
    }
}
