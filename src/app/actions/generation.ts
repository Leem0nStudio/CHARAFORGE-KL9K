
'use server';

import { z } from 'zod';
import { generateCharacterBio } from '@/ai/flows/character-bio/flow';
import { generateCharacterImage, type ImageEngineConfig } from '@/ai/flows/character-image/flow';
import type { AiModel } from '@/types/ai-model';

// The client now sends the selected model and lora objects directly.
const GenerateCharacterInputSchema = z.object({
  description: z.string().min(20).max(1000),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  dataPackId: z.string().optional().nullable(),
  
  // These are now complex objects, not just IDs.
  selectedModel: z.custom<AiModel>(),
  selectedLora: z.custom<AiModel>().optional().nullable(),
  
  // Specific settings from the UI that need to be passed down.
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

/**
 * Orchestrates the entire character generation process.
 * This server action is now the central point for building the AI configuration.
 * @param input The validated input data from the client, including the full model and lora objects.
 * @returns An object containing the generated character data or an error message.
 */
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
        // This is the new, centralized logic for building the engine config.
        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.type === 'model' && selectedModel.civitaiModelId === '0' ? 'gemini' : 'huggingface',
            modelId: selectedModel.hf_id,
            aspectRatio,
        };
        
        // If a LoRA is selected, add its details to the config.
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
        
        // Run both AI flows in parallel for efficiency
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
        console.error("Character Generation Orchestration Error:", message);
        return { success: false, message: 'Failed to generate character.', error: message };
    }
}
