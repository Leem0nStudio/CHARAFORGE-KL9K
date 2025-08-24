
      
'use server';

import { z } from 'zod';
import { generateCharacterSheet } from '@/ai/flows/character-sheet/flow';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/types/generation';
import { type TextEngineConfig } from '@/types/generation';
import type { AiModel } from '@/types/ai-model';
import { verifyAndGetUid } from '@/lib/auth/server';
import { getUserProfile } from '../actions/user';
import type { GenerateCharacterSheetOutput } from '@/ai/flows/character-sheet/types';


// Schema for the first step: generating the character sheet
const GenerateSheetInputSchema = z.object({
  description: z.string().min(1, "A description is required.").max(4000),
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
    physicalDescription: z.string().min(1, { message: "A physical description is required." }).max(4000),
    negativePrompt: z.string().optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
    selectedModel: z.custom<AiModel>().refine(data => !!data, { message: 'A base model must be selected.' }),
    selectedLora: z.custom<AiModel>().optional().nullable(),
    loraWeight: z.number().min(0).max(2).optional(),
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
        return { success: false, message: 'Invalid input.', error: validation.error.errors.map(e => e.message).join(', ') };
    }
    
    let uid: string | null = null;
    try {
        uid = await verifyAndGetUid();
    } catch (error) {
        // User is not logged in, which is acceptable.
    }
    
    const userProfile = uid ? await getUserProfile(uid) : null;
    const { description, targetLanguage, engineConfig } = validation.data;

    try {
        let userApiKey: string | undefined;
        if (engineConfig.engineId === 'openrouter' && userProfile) {
            userApiKey = userProfile.preferences?.openRouterApiKey;
        }

        const finalEngineConfig: TextEngineConfig = {
            ...engineConfig,
            userApiKey,
        };
        
        const result = await generateCharacterSheet({ 
            description: description, 
            targetLanguage, 
            engineConfig: finalEngineConfig
        });


        if (!result.name) {
            throw new Error('AI generation failed to return a complete character sheet.');
        }

         return {
            success: true,
            message: 'Character sheet generated successfully!',
            data: {
                ...result,
                originalDescription: description, // Return the user's original, unformatted prompt
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
        return { success: false, message: 'Invalid input.', error: validation.error.errors.map(e => e.message).join(', ') };
    }

    const {
        physicalDescription,
        negativePrompt,
        aspectRatio,
        selectedModel,
        selectedLora,
        loraWeight,
    } = validation.data;
    
    let uid: string | null = null;
    try {
        uid = await verifyAndGetUid();
    } catch (error) {
        // User is not logged in.
    }
    
    const userProfile = uid ? await getUserProfile(uid) : null;
    
     try {
        const executionModelId = selectedModel.engine === 'gemini' ? undefined : selectedModel.hf_id;

        let userApiKey: string | undefined;
        if (selectedModel.engine === 'huggingface') {
            userApiKey = userProfile?.preferences?.huggingFaceApiKey;
        } else if (selectedModel.engine === 'openrouter') {
            userApiKey = userProfile?.preferences?.openRouterApiKey;
        }


        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: executionModelId,
            aspectRatio,
            userApiKey: userApiKey,
            apiUrl: selectedModel.apiUrl,
            comfyWorkflow: selectedModel.comfyWorkflow,
        };
        
        let finalDescription = physicalDescription;

        if (selectedLora) {
            let loraIdentifier: string | undefined;
            if (selectedModel.engine === 'vertexai') {
                loraIdentifier = selectedLora.vertexAiAlias || selectedLora.civitaiModelId;
            } else if (selectedModel.engine === 'modelslab') {
                loraIdentifier = selectedLora.modelslabModelId;
            } else {
                 loraIdentifier = selectedLora.civitaiModelId;
            }
            
            if (!loraIdentifier) {
                 throw new Error(`The selected LoRA '${selectedLora.name}' is not configured correctly for use with the ${selectedModel.engine} engine.`);
            }

            imageEngineConfig.lora = {
                id: loraIdentifier,
                weight: loraWeight || 0.75,
                triggerWords: selectedLora.triggerWords,
            };
        }
        
        const imageResult = await generateCharacterImage({ 
            description: finalDescription,
            negativePrompt: negativePrompt,
            engineConfig: imageEngineConfig 
        });
        
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

    
    