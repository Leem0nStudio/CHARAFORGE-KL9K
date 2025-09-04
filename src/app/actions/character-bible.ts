
'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { characterBibleGen } from '@/ai/flows/character-bible/flow';
import type { CharacterBible, CharacterBibleInput } from '@/ai/flows/character-bible/types';

// This type can be expanded with more details if needed, e.g., usage counts, ratings
type SavedPrompt = {
    id: string;
    text: string;
    createdAt: Date;
};

/**
 * Server action to generate a character bible using the Genkit flow.
 */
export async function generateCharacterBible(input: CharacterBibleInput): Promise<{ success: boolean; data?: CharacterBible; message?: string }> {
    try {
        console.log('Generating character bible with input:', input);
        const result = await characterBibleGen(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error generating character bible:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message };
    }
}

/**
 * Fetches a list of saved prompts for the current user.
 * NOTE: This is a placeholder. A real implementation would fetch from a database.
 */
export async function getSavedPrompts(): Promise<SavedPrompt[]> {
    // Placeholder data
    return [
        { id: '1', text: 'A grizzled space marine captain with a dark secret', createdAt: new Date() },
        { id: '2', text: 'An elven princess who secretly yearns for a life of piracy', createdAt: new Date() },
        { id: '3', text: 'A sentient robot street artist in a cyberpunk city', createdAt: new Date() },
    ];
}
