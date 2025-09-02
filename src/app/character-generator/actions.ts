
'use server';

import { z } from 'zod';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';
import type { ImageEngineConfig } from '@/types/generation';
import type { AiModel } from '@/types/ai-model';
import { generateCharacterBibleAction } from '../actions/character-bible';
import type { CharacterBible, CharacterBibleInput } from '@/ai/flows/character-bible/types';


// This type combines the full CharacterBible with the derived prompts for UI use.
export type CharacterBibleResult = {
    bible: CharacterBible;
    renderPrompt: string;
    negativePrompt: string;
};

// Re-export for client-side use without needing a separate file
export type { CharacterBible, CharacterBibleInput };

// Schema for the second step: generating the portrait
const GeneratePortraitInputSchema = z.object({
    description: z.string().min(1, { message: "A physical description is required." }).max(4000),
    negativePrompt: z.string().optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
    backgroundStyle: z.enum(['scenic', 'white', 'black']).default('scenic'), // New field
    selectedModel: z.custom<AiModel>().refine(data => !!data, { message: 'A base model must be selected.' }),
    selectedLora: z.custom<AiModel>().optional().nullable(),
    loraWeight: z.number().min(0).max(2).optional(),
    userApiKey: z.string().optional(), // Pass the user's API key if available
});
export type GeneratePortraitInput = z.infer<typeof GeneratePortraitInputSchema>;

export type GeneratePortraitOutput = {
    success: boolean;
    message: string;
    imageUrl?: string;
    error?: string;
}


// This is a wrapper around the new Character Bible action, keeping the interface simple for the generator.
export async function generateCharacterCore(input: CharacterBibleInput): Promise<{ success: boolean; message: string; data?: CharacterBibleResult; error?: string; }> {
    try {
        const result = await generateCharacterBibleAction(input);
        if (result.success && result.characterBible && result.renderPrompt && result.negativePrompt) {
            return { 
                success: true, 
                message: "Character Core generated successfully!",
                data: {
                    bible: result.characterBible,
                    renderPrompt: result.renderPrompt,
                    negativePrompt: result.negativePrompt,
                }
            };
        }
        throw new Error(result.error || "Failed to generate Character Bible.");
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to generate character core.", error: message };
    }
}


export async function generateCharacterPortrait(input: GeneratePortraitInput): Promise<GeneratePortraitOutput> {
    const validation = GeneratePortraitInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.errors.map(e => e.message).join(', ') };
    }

    const {
        description,
        negativePrompt,
        aspectRatio,
        backgroundStyle,
        selectedModel,
        selectedLora,
        loraWeight,
        userApiKey,
    } = validation.data;
    
     try {
        const executionModelId = selectedModel.engine === 'gemini' ? undefined : selectedModel.hf_id;

        const imageEngineConfig: ImageEngineConfig = {
            engineId: selectedModel.engine,
            modelId: executionModelId,
            aspectRatio,
            userApiKey: userApiKey,
            apiUrl: selectedModel.apiUrl,
            comfyWorkflow: selectedModel.comfyWorkflow,
        };
        
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
        
        let finalDescription = description;
        if (backgroundStyle === 'white' || backgroundStyle === 'black') {
            // Replace the background part of the prompt
            finalDescription = description.replace(/environment:.*?;/g, `(${backgroundStyle} background),`);
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
