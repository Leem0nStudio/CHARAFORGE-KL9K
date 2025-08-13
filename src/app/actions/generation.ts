
'use server';

import { z } from 'zod';
import { generateCharacterBio } from '@/ai/flows/character-bio/flow';
import { generateCharacterImage, type ImageEngineConfig } from '@/ai/flows/character-image/flow';
import type { AiModel } from '@/types/ai-model';

const GenerateCharacterInputSchema = z.object({
  description: z.string().min(20).max(1000),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  dataPackId: z.string().optional().nullable(),
  selectedModel: z.custom<AiModel>(),
  selectedLora: z.custom<AiModel>().optional().nullable(),
  loraVersionId: z.string().optional(),
  loraWeight: z.number().min(0).max(1).optional(),
});

export type GenerateCharacterInput = z.infer<typeof GenerateCharacterInputSchema>;

export type GenerateCharacterOutput = {
    success: boolean;
    message: string;
    data?: {
        biography: string;
        imageUrl: string;
        description: string;
        tags: string;
        dataPackId?: string | null;
    };
    error?: string;
};

export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
    const validation = GenerateCharacterInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }

    const { 
        description, 
        targetLanguage, 
        aspectRatio, 
        dataPackId,
        tags,
        selectedModel,
        selectedLora,
        loraVersionId,
        loraWeight
    } = validation.data;

    if (!selectedModel) {
        return { success: false, message: 'A base model must be selected for generation.' };
    }

    try {
        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: selectedModel.hf_id,
            aspectRatio,
        };
        
        if (selectedLora) {
            const loraVersion = selectedLora.versions?.find(v => v.id === loraVersionId) 
                || { id: selectedLora.versionId, triggerWords: selectedLora.triggerWords };

            imageEngineConfig.lora = {
                id: selectedLora.civitaiModelId,
                versionId: loraVersion.id,
                weight: loraWeight || 0.75,
                triggerWords: loraVersion.triggerWords,
            };
        }
        
        const [bioResult, imageResult] = await Promise.all([
            generateCharacterBio({ description, targetLanguage }),
            generateCharacterImage({ description, engineConfig: imageEngineConfig })
        ]);
        
        if (!bioResult.biography || !imageResult.imageUrl) {
            throw new Error('One or more AI generation steps failed to return data.');
        }

        return {
            success: true,
            message: 'Character generated successfully!',
            data: {
                biography: bioResult.biography,
                imageUrl: imageResult.imageUrl,
                description,
                tags: tags || '',
                dataPackId,
            }
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
        return { success: false, message: 'Failed to generate character.', error: message };
    }
}
