
'use server';

import { z } from 'zod';
import { generateCharacterBio } from '@/ai/flows/character-bio/flow';
import { generateCharacterImage } from '@/ai/flows/character-image/flow';

const GenerateCharacterInputSchema = z.object({
  description: z.string().min(20).max(1000),
  tags: z.string().optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  imageEngine: z.enum(['huggingface', 'gemini']).default('huggingface'),
  hfModelId: z.string().optional(),
  lora: z.string().optional(),
  loraWeight: z.number().min(0).max(1).optional(),
  triggerWords: z.string().optional(),
  dataPackId: z.string().optional().nullable(),
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
 * It calls the biography and image generation flows in parallel to improve performance.
 * @param input The validated input data from the client.
 * @returns An object containing the generated character data or an error message.
 */
export async function generateCharacter(input: GenerateCharacterInput): Promise<GenerateCharacterOutput> {
    const validation = GenerateCharacterInputSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }

    const { description, targetLanguage, aspectRatio, imageEngine, hfModelId, lora, loraWeight, triggerWords, tags, dataPackId } = validation.data;

    try {
        // Run both AI flows in parallel for efficiency
        const [bioResult, imageResult] = await Promise.all([
            generateCharacterBio({ description, targetLanguage }),
            generateCharacterImage({ description, aspectRatio, imageEngine, hfModelId, lora, loraWeight, triggerWords })
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
