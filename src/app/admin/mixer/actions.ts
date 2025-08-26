'use server';

import { z } from 'zod';
import { generateArchitectPrompt as generateArchitectPromptFlow } from '@/ai/flows/prompt-architect/flow';
import type { GenerateArchitectPromptInput, GenerateArchitectPromptOutput } from '@/ai/flows/prompt-architect/types';

type ActionResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
};

// Zod schema for input validation from the client component.
const GeneratePromptSchema = z.object({
  focusModule: z.enum(['character_focus', 'scene_focus', 'action_focus', 'integrated']),
  seed: z.number().optional(),
});

export async function generateArchitectPrompt(input: GenerateArchitectPromptInput): Promise<ActionResponse<GenerateArchitectPromptOutput>> {
    
    const validation = GeneratePromptSchema.safeParse(input);
    if (!validation.success) {
        return { success: false, message: 'Invalid input.', error: validation.error.message };
    }
    
    try {
        const result = await generateArchitectPromptFlow(validation.data);
        return {
            success: true,
            message: 'Prompt generated successfully.',
            data: result,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        console.error("Prompt Architect Action Error:", message);
        return { success: false, message: 'Failed to generate prompt.', error: message };
    }
}
