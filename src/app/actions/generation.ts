
'use server';

import { z } from 'zod';
import { generateCharacterSheet } from '@/ai/flows/character-sheet/flow';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import { type TextEngineConfig } from '@/ai/flows/character-sheet/types';
import type { AiModel } from '@/types/ai-model';
import { verifyAndGetUid } from '@/lib/auth/server';
import { getUserProfile } from './user';
import type { GenerateCharacterSheetOutput } from '@/ai/flows/character-sheet/types';


// Schema for the first step: generating the character sheet
const GenerateSheetInputSchema = z.object({
  description: z.string().min(20).max(1000),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  engineConfig: z.custom<TextEngineConfig>(),
});
export type GenerateSheetInput = z.infer<typeof GenerateSheetInputSchema>;

export type GenerateSheetOutput = {
    success: boolean;
    message: string;
    data?: GenerateCharacterSheetOutput & { originalDescription: string };
    error?: string;
};


// Schema for the second step: generating the portrait
const GeneratePortraitInputSchema = z.object({
    physicalDescription: z.string().min(20, { message: "A detailed physical description is required." }).max(2000),
    aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
    selectedModel: z.custom<AiModel>().refine(data => !!data, { message: 'A base model must be selected.' }),
    selectedLora: z.custom<AiModel>().optional().nullable(),
    loraVersionId: z.string().optional(),
    loraWeight: z.number().min(0).max(1).optional(),
    userApiKey: z.string().optional(), // Now passed from client
});
export type GeneratePortraitInput = z.infer<typeof GeneratePortraitInputSchema>;

export type GeneratePortraitOutput = {
    success: boolean;
    message: string;
    imageUrl?: string;
    error?: string;
}


export async function generateCharacterSheetData(input: GenerateSheetInput): Promise<GenerateSheetOutput> {
    const validation = GenerateSheetInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }
    // This action can now be called by unauthenticated users.
    // await verifyAndGetUid();

    const { description, targetLanguage, engineConfig } = validation.data;

    try {
        const result = await generateCharacterSheet({ 
            description, 
            targetLanguage, 
            engineConfig
        });


        if (!result.name) {
            throw new Error('AI generation failed to return a complete character sheet.');
        }

         return {
            success: true,
            message: 'Character sheet generated successfully!',
            data: {
                ...result,
                originalDescription: description,
            }
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
        console.error("Error in generateCharacterSheetData action:", message);
        return { success: false, message: 'Failed to generate character sheet.', error: message };
    }
}


export async function generateCharacterPortrait(input: GeneratePortraitInput): Promise<GeneratePortraitOutput> {
    const validation = GeneratePortraitInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }

    // This action can now be called by unauthenticated users.
    // await verifyAndGetUid();
    
    const {
        physicalDescription,
        aspectRatio,
        selectedModel,
        selectedLora,
        loraVersionId,
        loraWeight,
        userApiKey, // User API key is now received directly
    } = validation.data;

    if (!selectedModel) {
        return { success: false, message: 'A base model must be selected for generation.' };
    }
    
     try {
        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: selectedModel.engine !== 'gemini' ? selectedModel.hf_id : undefined,
            aspectRatio,
            userApiKey: userApiKey,
        };
        
        let finalDescription = physicalDescription;

        if (selectedLora && (selectedModel.engine === 'huggingface' || selectedModel.engine === 'vertexai')) {
            const loraVersion = selectedLora.versions?.find(v => v.id === loraVersionId) 
                || { id: selectedLora.versionId, triggerWords: selectedLora.triggerWords };

            imageEngineConfig.lora = {
                id: selectedLora.civitaiModelId || selectedLora.name, // Fallback to name for Vertex AI alias
                versionId: loraVersion.id,
                weight: loraWeight || 0.75,
                triggerWords: loraVersion.triggerWords,
            };

            if (loraVersion.triggerWords && loraVersion.triggerWords.length > 0) {
                const words = loraVersion.triggerWords.join(', ');
                finalDescription = `${words}, ${physicalDescription}`;
            }
        }
        
        const imageResult = await generateCharacterImage({ description: finalDescription, engineConfig: imageEngineConfig });
        
        if (!imageResult.imageUrl) {
            throw new Error('AI generation failed to return an image.');
        }

        return {
            success: true,
            message: 'Portrait generated successfully!',
            imageUrl: imageResult.imageUrl,
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
        console.error("Error in generateCharacterPortrait action:", message);
        return { success: false, message: 'Failed to generate portrait.', error: message };
    }
}

    

    