
'use server';

import { z } from 'zod';
import { generateCharacterBio } from '@/ai/flows/character-bio/flow';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/ai/flows/character-image/types';
import type { TextEngineConfig } from '@/ai/utils/llm-utils';
import type { AiModel } from '@/types/ai-model';
import { verifyAndGetUid } from '@/lib/auth/server';
import { getUserProfile } from './user';


// Schema for the first step: generating text details
const GenerateDetailsInputSchema = z.object({
  description: z.string().min(20).max(1000),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  dataPackId: z.string().optional().nullable(),
});
export type GenerateDetailsInput = z.infer<typeof GenerateDetailsInputSchema>;

export type GenerateDetailsOutput = {
    success: boolean;
    message: string;
    data?: {
        biography: string;
        description: string;
        tags: string;
        dataPackId?: string | null;
    };
    error?: string;
};


// Schema for the second step: generating the image
const GeneratePortraitInputSchema = z.object({
    description: z.string().min(20).max(1000),
    aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
    selectedModel: z.custom<AiModel>().refine(data => !!data, { message: 'A base model must be selected.' }),
    selectedLora: z.custom<AiModel>().optional().nullable(),
    loraVersionId: z.string().optional(),
    loraWeight: z.number().min(0).max(1).optional(),
});
export type GeneratePortraitInput = z.infer<typeof GeneratePortraitInputSchema>;

export type GeneratePortraitOutput = {
    success: boolean;
    message: string;
    imageUrl?: string;
    error?: string;
}


export async function generateCharacterDetails(input: GenerateDetailsInput): Promise<GenerateDetailsOutput> {
    const validation = GenerateDetailsInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }
    await verifyAndGetUid();

    const { description, targetLanguage, dataPackId, tags } = validation.data;

    try {
        // For now, text generation always uses the default Gemini model.
        // This is where we could, in the future, let the user choose a text model.
        const textEngineConfig: TextEngineConfig = {
            engineId: 'gemini',
            modelId: 'googleai/gemini-1.5-flash-latest',
        };

        const bioResult = await generateCharacterBio({ description, targetLanguage, engineConfig: textEngineConfig });

        if (!bioResult.biography) {
            throw new Error('AI generation failed to return a biography.');
        }

         return {
            success: true,
            message: 'Character details generated successfully!',
            data: {
                biography: bioResult.biography,
                description,
                tags: tags || '',
                dataPackId,
            }
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
        console.error("Error in generateCharacterDetails action:", message);
        return { success: false, message: 'Failed to generate character details.', error: message };
    }
}


export async function generateCharacterPortrait(input: GeneratePortraitInput): Promise<GeneratePortraitOutput> {
    const validation = GeneratePortraitInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }

    const uid = await verifyAndGetUid();
    const userProfile = await getUserProfile(uid);
    
    const {
        description,
        aspectRatio,
        selectedModel,
        selectedLora,
        loraVersionId,
        loraWeight
    } = validation.data;

    if (!selectedModel) {
        return { success: false, message: 'A base model must be selected for generation.' };
    }
    
    let userApiKey: string | undefined;
    if (selectedModel.engine === 'huggingface') {
        userApiKey = userProfile?.preferences?.huggingFaceApiKey;
    } else if (selectedModel.engine === 'openrouter') {
        userApiKey = userProfile?.preferences?.openRouterApiKey;
    }

     try {
        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: selectedModel.engine !== 'gemini' ? selectedModel.hf_id : undefined,
            aspectRatio,
            userApiKey: userApiKey,
        };
        
        let finalDescription = description;

        if (selectedLora && selectedModel.engine === 'huggingface') {
            const loraVersion = selectedLora.versions?.find(v => v.id === loraVersionId) 
                || { id: selectedLora.versionId, triggerWords: selectedLora.triggerWords };

            imageEngineConfig.lora = {
                id: selectedLora.civitaiModelId,
                versionId: loraVersion.id,
                weight: loraWeight || 0.75,
                triggerWords: loraVersion.triggerWords,
            };

            if (loraVersion.triggerWords && loraVersion.triggerWords.length > 0) {
                const words = loraVersion.triggerWords.join(', ');
                finalDescription = `${words}, ${description}`;
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
