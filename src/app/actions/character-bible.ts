'use server';

import { generateCharacterBible as characterBibleGen } from '@/ai/flows/character-bible/flow';
import type { CharacterBible, CharacterBibleInput } from '@/ai/flows/character-bible/types';

/**
 * Server action to generate a character bible using the Genkit flow.
 */
export async function generateCharacterBible(input: CharacterBibleInput): Promise<{ success: boolean; data?: CharacterBible; message?: string }> {
    try {
        const result = await characterBibleGen(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error generating character bible:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message };
    }
}
