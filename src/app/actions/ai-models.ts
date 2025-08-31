
'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
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


export async function upsertModel(data: UpsertAiModel): Promise<ActionResponse> {
    await verifyAndGetUid();
    const validation = UpsertModelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }
    const { id, ...modelData } = validation.data;

    try {
        const supabase = getSupabaseServerClient();
        
        const finalData = {
            ...modelData,
            updated_at: new Date().toISOString(),
            user_id: null,
        };
        
        if (id) {
            const { error } = await supabase
                .from('ai_models')
                .update(finalData)
                .eq('id', id);
            
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('ai_models')
                .insert({ 
                    ...finalData, 
                    created_at: new Date().toISOString(),
                    sync_status: 'notsynced',
                });
            
            if (error) throw error;
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
        const supabase = getSupabaseServerClient();
        const { data: existingModels, error: queryError } = await supabase
            .from('ai_models')
            .select('id')
            .eq(`${source}_model_id`, sourceModelId)
            .limit(1);
        
        if (queryError) throw queryError;
        if (existingModels && existingModels.length > 0) {
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
                error: `The API for model "${modelInfo.name || sourceModelId}" did not return any usable version information.`
            };
        }
        
        const latestVersion = modelVersions[0];

        let coverMediaUrl: string | null = null;
        let coverMediaType: 'image' | 'video' = 'image';
        
        interface CivitaiImage {
  url: string;
  type: string;
  meta?: {
    video?: {
      url: string;
    };
  };
}

interface CivitaiModelVersion {
  id: number;
  name: string;
  baseModel: string;
  trainedWords: string[];
  images: CivitaiImage[];
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
            const { data: baseModels, error: baseModelError } = await supabase
                .from('ai_models')
                .select('*')
                .eq('type', 'model')
                .eq('base_model', baseModelName)
                .limit(1);

            if (!baseModelError && baseModels && baseModels.length > 0) {
                const baseModel = baseModels[0] as AiModel;
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
            modelslabModelId: source === 'modelslab' ? (modelInfo.model_id || sourceModelId).toString() : undefined,
            hf_id: source === 'modelslab' ? (modelInfo.model_id || sourceModelId).toString() : suggestedHfId,
            type: modelInfo.type.toLowerCase() === 'lora' ? 'lora' : 'model',
            engine: engine, 
            versionId: latestVersion?.id?.toString() || '',
            baseModel: baseModelName,
            coverMediaUrl,
            coverMediaType,
            triggerWords: triggerWords,
            versions: modelVersions?.map((v: CivitaiModelVersion) => ({ 
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
    
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Operation failed.", error: message };
    }
}



interface RawModelData {
  id?: string;
  name: string | null;
  type: string | null;
  engine: string | null;
  triggerWords: string | null;
  hf_id?: string | null;
  modelslabModelId?: string | null;
}

export async function upsertUserAiModel(formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    
    const rawData: RawModelData = {
        id: (formData.get('id') as string) || undefined,
        name: formData.get('name') as string | null,
        type: formData.get('type') as string | null,
        engine: formData.get('engine') as string | null,
        triggerWords: formData.get('triggerWords') as string | null,
    };
    
    if (rawData.engine === 'huggingface') {
        rawData.hf_id = formData.get('hf_id') as string | null;
    } else if (rawData.engine === 'modelslab') {
        rawData.modelslabModelId = formData.get('modelslabModelId') as string | null;
        rawData.hf_id = formData.get('modelslabModelId') as string | null;
    }

    const validation = UpsertModelSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }

    const { id, ...modelData } = validation.data;
    const isNew = !id;
    const coverImageFile = formData.get('coverImage') as File | null;

    try {
        const supabase = getSupabaseServerClient();

        if (!isNew) {
            const { data: existingModel, error: queryError } = await supabase
                .from('ai_models')
                .select('user_id')
                .eq('id', id)
                .single();
            
            if (queryError || !existingModel || existingModel.user_id !== uid) {
                return { success: false, message: "Permission denied or model not found." };
            }
        }
        
        let coverMediaUrl = modelData.coverMediaUrl || null;
        if (coverImageFile && coverImageFile.size > 0) {
            const modelId = isNew ? crypto.randomUUID() : id;
            const destinationPath = `usersImg/${uid}/ai_models/${modelId}/cover.png`;
            coverMediaUrl = await uploadToStorage(coverImageFile, destinationPath);
        }

        const finalData = {
            ...modelData,
            user_id: uid,
            cover_media_url: coverMediaUrl,
            updated_at: new Date().toISOString(),
        };

        if (isNew) {
            const { error: insertError } = await supabase
                .from('ai_models')
                .insert({ 
                    ...finalData, 
                    created_at: new Date().toISOString()
                });
            
            if (insertError) throw insertError;
        } else {
            const { error: updateError } = await supabase
                .from('ai_models')
                .update(finalData)
                .eq('id', id);
            
            if (updateError) throw updateError;
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
    
    try {
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('ai_models')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
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
    // Use a Map to handle merging system and user models, ensuring no duplicates.
    const allModels = new Map<string, AiModel>();

    // Add static system models first (like Gemini).
    const staticModels = type === 'model' ? imageModels : [];
    staticModels.forEach(model => {
        allModels.set(model.id, model);
    });

    try {
        const supabase = getSupabaseServerClient();
        
        // Fetch all system-wide (non-user-specific) models from Supabase
        const { data: systemModels, error: systemError } = await supabase
            .from('ai_models')
            .select('*')
            .eq('type', type)
            .is('user_id', null);
        
        if (systemError) throw systemError;
        
        // Process system models
        systemModels?.forEach(data => {
            const model: AiModel = {
                ...data,
                id: data.id,
                createdAt: data.created_at ? new Date(data.created_at) : new Date(),
                updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
            } as AiModel;
            if (!allModels.has(model.id)) {
                allModels.set(model.id, model);
            }
        });

        // If a user is logged in, fetch their personal models
        if (uid) {
            const { data: userModels, error: userError } = await supabase
                .from('ai_models')
                .select('*')
                .eq('user_id', uid)
                .eq('type', type)
                .order('created_at', { ascending: false });
            
            if (userError) throw userError;
            
            // Process user models
            userModels?.forEach(data => {
                const model: AiModel = {
                    ...data,
                    id: data.id,
                    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
                    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
                } as AiModel;
                if (!allModels.has(model.id)) {
                    allModels.set(model.id, model);
                }
            });
        }
        
        return Array.from(allModels.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        return []; // Return empty array on error to prevent crashes
    }
}


export async function installModel(modelId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();

    try {
        const supabase = getSupabaseServerClient();

        // Check if model exists and is not user-specific
        const { data: model, error: modelError } = await supabase
            .from('ai_models')
            .select('user_id')
            .eq('id', modelId)
            .single();

        if (modelError || !model) {
            return { success: false, message: "This model does not exist." };
        }
        if (model.user_id) {
            return { success: false, message: "Cannot install a user-specific model." };
        }

        // Check if user already has this model installed
        const { data: userStats, error: userError } = await supabase
            .from('users')
            .select('stats')
            .eq('id', uid)
            .single();

        if (userError) throw userError;

        const installedModels = userStats?.stats?.installedModels || [];
        if (installedModels.includes(modelId)) {
            return { success: false, message: "You have already installed this model." };
        }

        // Add model to user's installed models
        const { error: updateError } = await supabase
            .from('users')
            .update({
                stats: {
                    ...userStats?.stats,
                    installedModels: [...installedModels, modelId],
                },
            })
            .eq('id', uid);

        if (updateError) throw updateError;

        revalidatePath('/profile');
        revalidatePath('/models');

        return { success: true, message: "Model successfully installed!" };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Install Model Error:", message);
        return { success: false, message: "Failed to install model." };
    }
}



  