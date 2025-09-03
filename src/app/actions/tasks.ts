
'use server';

import { revalidatePath } from 'next/cache';
import { verifyIsAdmin } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import axios from 'axios';
import { uploadToStorage } from '@/services/storage';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function getCivitaiDownloadUrl(versionId: string): Promise<string> {
    const apiKey = process.env.CIVITAI_API_KEY;
    if (!apiKey) throw new Error('CIVITAI_API_KEY environment variable not set.');
    
    const url = `https://civitai.com/api/v1/model-versions/${versionId}`;
    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    const downloadUrl = response.data?.files?.[0]?.downloadUrl;
    
    if (!downloadUrl) throw new Error(`Could not find download URL for Civitai version ID ${versionId}.`);
    
    return `${downloadUrl}?token=${apiKey}`;
}

export async function enqueueModelSyncJob(modelId: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    const modelRef = supabase.from('ai_models').select('*').eq('id', modelId).single();

    try {
        await supabase.from('ai_models').update({ sync_status: 'syncing', sync_error: null }).eq('id', modelId);
        revalidatePath('/admin/models');

        const { data: modelData, error: fetchError } = await modelRef;
        if (fetchError || !modelData) throw new Error("Model not found or failed to fetch.");
        if (!modelData.civitai_model_id || !modelData.version_id) {
            throw new Error('Model is missing required Civitai fields for syncing.');
        }

        const downloadUrl = await getCivitaiDownloadUrl(modelData.version_id);
        
        const response = await axios.get(downloadUrl, { responseType: 'stream' });
        
        const fileExtension = modelData.name?.split('.').pop() || 'safetensors';
        const blobName = `models/${modelData.name.replace(/\s+/g, '_')}/${modelData.version_id}.${fileExtension}`;
        
        // Convert stream to buffer to use with uploadToStorage
        const chunks: Buffer[] = [];
        for await (const chunk of response.data) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        
        const publicUrl = await uploadToStorage(buffer, blobName);

        await supabase.from('ai_models').update({ sync_status: 'synced', gcs_uri: publicUrl }).eq('id', modelId);

        revalidatePath('/admin/models');
        return { success: true, message: `Model ${modelId} synced successfully.` };

    } catch (error: any) {
        const message = error.message || 'An unknown error occurred.';
        await supabase.from('ai_models').update({ sync_status: 'error', sync_error: message }).eq('id', modelId);
        revalidatePath('/admin/models');
        return { success: false, message: 'Failed to sync model.', error: message };
    }
}
