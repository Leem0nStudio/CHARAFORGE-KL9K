
'use server';

import { revalidatePath } from 'next/cache';
import { verifyIsAdmin } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

export async function enqueueModelSyncJob(modelId: string): Promise<ActionResponse> {
    await verifyIsAdmin();
    
    const project = process.env.GCLOUD_PROJECT;
    const location = process.env.GCLOUD_LOCATION || 'us-central1';
    const queue = 'model-sync-jobs';
    const functionUrl = `https://${location}-${project}.cloudfunctions.net/syncModelWorker`;
    const serviceAccountEmail = process.env.APP_ENGINE_SERVICE_ACCOUNT;

    if (!project || !serviceAccountEmail) {
        const errorMsg = 'Project ID and App Engine service account must be configured in environment variables.';
        console.error('enqueueModelSyncJob Error:', errorMsg);
        return { success: false, message: 'Server configuration error.', error: errorMsg };
    }

    // Dynamic import to ensure this only loads on the server.
    const { CloudTasksClient } = await import('@google-cloud/tasks');
    const tasksClient = new CloudTasksClient();
    const parent = tasksClient.queuePath(project, location, queue);

    const payload = { modelId };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url: functionUrl,
            headers: { 'Content-Type': 'application/json' },
            body,
            oidcToken: {
                serviceAccountEmail,
            },
        },
    };

    try {
        console.log(`Enqueuing task for model ${modelId} to queue ${queue}`);
        const [response] = await tasksClient.createTask({ parent, task });
        console.log(`Successfully created task: ${response.name}`);

        // Update model status in Supabase
        const supabase = getSupabaseServerClient();
        const { error } = await supabase
            .from('ai_models')
            .update({ 
                sync_status: 'queued', 
                sync_error: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', modelId);

        if (error) {
            console.error('Failed to update model status in Supabase:', error);
        }

        revalidatePath('/admin/models');

        return { success: true, message: `Sync job for model ${modelId} has been queued.` };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`Failed to enqueue task for model ${modelId}:`, message);
        
        // Update the model in Supabase to reflect the queuing error
        const supabase = getSupabaseServerClient();
        const { error: updateError } = await supabase
            .from('ai_models')
            .update({ 
                sync_status: 'error', 
                sync_error: `Failed to queue task: ${message}`,
                updated_at: new Date().toISOString()
            })
            .eq('id', modelId);

        if (updateError) {
            console.error('Failed to update model error status in Supabase:', updateError);
        }

        revalidatePath('/admin/models');
        return { success: false, message: 'Failed to queue sync job.', error: message };
    }
}
