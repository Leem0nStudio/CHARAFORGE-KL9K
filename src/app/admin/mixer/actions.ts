
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { AiModel } from '@/types/ai-model';
import { revalidatePath } from 'next/cache';

const ModelToMixSchema = z.object({
  modelId: z.string().min(1),
  weight: z.number().min(0).max(1),
});

const MixerFormSchema = z.object({
  name: z.string().min(3),
  baseModel: z.string().min(1),
  modelsToMix: z.array(ModelToMixSchema).min(2),
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
    
    const { name, baseModel, modelsToMix } = validation.data;
    
    // In a real scenario, this action would trigger a long-running backend process.
    // For this prototype, we will create a new AiModel document with a 'pending' status
    // and the recipe for the mix.
    
    try {
        if (!adminDb) {
            throw new Error("Database service is not initialized.");
        }
        
        const newModelRef = adminDb.collection('ai_models').doc();
        
        const newModelData: Partial<AiModel> = {
            id: newModelRef.id,
            name,
            baseModel,
            type: 'model', // All mixes result in a base model
            engine: 'comfyui', // Assuming a ComfyUI or similar backend would perform the mix
            hf_id: `mixed/${newModelRef.id}.safetensors`, // A predictable future path
            syncStatus: 'notsynced',
            userId: undefined, // System model
            createdAt: FieldValue.serverTimestamp() as any,
            updatedAt: FieldValue.serverTimestamp() as any,
            // Store the recipe for the backend worker
            mixRecipe: modelsToMix, 
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
