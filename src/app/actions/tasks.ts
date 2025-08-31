
'use server';

import { revalidatePath } from 'next/cache';
import { verifyIsAdmin } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

// The logic for Cloud Tasks is very Google Cloud-specific.
// For Supabase, background jobs are often handled by pg_cron or Edge Functions.
// This function will be simplified to directly update the status,
// as the full background job migration is a much larger architectural change.
export async function enqueueModelSyncJob(modelId: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    const supabase = getSupabaseServerClient();
    
    // In a full Supabase migration, you would call an Edge Function here
    // or insert a job into a pg_cron queue.
    // For now, we will simulate the "queued" status update.
    console.warn("Model sync task enqueuing is a placeholder. Full implementation requires setting up Supabase Edge Functions or pg_cron.");

    try {
        const { error } = await supabase
            .from('ai_models')
            .update({ sync_status: 'queued', sync_error: null })
            .eq('id', modelId);

        if (error) throw error;
        
        revalidatePath('/admin/models');

        return { success: true, message: `Sync job for model ${modelId} has been queued.` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`Failed to queue task for model ${modelId}:`, message);
        
        await supabase
            .from('ai_models')
            .update({ sync_status: 'error', sync_error: `Failed to queue task: ${message}` })
            .eq('id', modelId);
            
        revalidatePath('/admin/models');
        return { success: false, message: 'Failed to queue sync job.', error: message };
    }
}

    