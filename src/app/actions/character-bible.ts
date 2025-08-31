
'use server';

import { generateCharacterBible } from "@/ai/flows/character-bible/flow";
import type { CharacterBible, CharacterBibleInput } from "@/ai/flows/character-bible/types";
import { buildNegativePrompt, buildRenderPrompt } from "@/services/prompt-builder";

// Define the response type for the server action
export type GenerateCharacterBibleResponse = {
    success: boolean;
    message: string;
    characterBible?: CharacterBible;
    renderPrompt?: string;
    negativePrompt?: string;
    error?: string;
};

/**
 * A server action that orchestrates the entire Character Bible generation process.
 * It takes user input, calls the Genkit flow to get the structured JSON,
 * and then uses the prompt builder service to assemble the final prompts.
 * @param input - The user's specifications for the character.
 * @returns A promise that resolves to a `GenerateCharacterBibleResponse` object.
 */
export async function generateCharacterBibleAction(input: CharacterBibleInput): Promise<GenerateCharacterBibleResponse> {
    try {
        // 1. Call the Genkit flow to get the structured Character Bible from the AI.
        const characterBible = await generateCharacterBible(input);

        // 2. Use the prompt builder service to construct the final prompts from the bible.
        const renderPrompt = buildRenderPrompt(characterBible);
        const negativePrompt = buildNegativePrompt(input.negative_hints);

        return {
            success: true,
            message: "Character Bible generated successfully.",
            characterBible,
            renderPrompt,
            negativePrompt,
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        console.error("Character Bible Action Error:", error);
        return {
            success: false,
            message: "Failed to generate Character Bible.",
            error: message,
        };
    }
}
