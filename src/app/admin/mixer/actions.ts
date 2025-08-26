'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { revalidatePath } from 'next/cache';


const MixerFormSchema = z.object({
  name: z.string().min(3),
  mergeScript: z.string().min(10),
  hfRepo: z.string().optional(),
});

type MixerFormValues = z.infer<typeof MixerFormSchema>;

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

export async function createMixedModel(data: MixerFormValues): Promise<ActionResponse> {
    await verifyAndGetUid();
    
    const validation = MixerFormSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }
    
    const { name, mergeScript, hfRepo } = validation.data;
    
    // In a real scenario, this action would trigger a long-running backend process.
    // For this prototype, we will create a new AiModel document with a 'notsynced' status
    // and the full recipe for the mix. A backend worker would then pick this up.
    
    try {
        if (!adminDb) {
            throw new Error("Database service is not initialized.");
        }
        
        const newModelRef = adminDb.collection('ai_models').doc();
        
        const newModelData: Partial<AiModel> = {
            id: newModelRef.id,
            name,
            baseModel: 'Mixed', // Base model is the result of the mix.
            type: 'model', // All mixes result in a base model
            engine: 'comfyui', // Assume a ComfyUI or similar backend will perform the mix
            hf_id: hfRepo ? `${hfRepo}` : `mixed/${name}.safetensors`,
            syncStatus: 'notsynced',
            userId: undefined, // System model
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any,
            // Store the full merge plan for the backend worker
            mixRecipe: {
                script: mergeScript,
                hfRepo: hfRepo,
            }, 
        };
        
        await newModelRef.set(newModelData);
        
        revalidatePath('/admin/models');
        
        return {
            success: true,
            message: `New model "${name}" has been queued for mixing.`,
        };
        
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        return { success: false, message: 'Failed to queue model for mixing.', error: message };
    }
}
