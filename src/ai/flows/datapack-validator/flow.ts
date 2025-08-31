
'use server';

/**
 * @fileOverview This AI flow validates a DataPack concept and suggests the schema slots (modules)
 * that would be most appropriate for it. This is the first step in the granular
 * DataPack creation process.
 */

import { ai } from '@/ai/genkit';
import { ValidateDataPackInputSchema, ValidateDataPackOutputSchema, type ValidateDataPackInput, type ValidateDataPackOutput } from './types';
import { z } from 'zod';

export async function validateAndSuggestDataPackSlots(input: ValidateDataPackInput): Promise<ValidateDataPackOutput> {
  return validateDataPackFlow(input);
}

// Define a more flexible schema for internal processing.
const FlexibleOutputSchema = z.object({
  isValid: z.boolean().optional(),
  feedback: z.string().optional(),
  suggestedSlots: z.array(z.string()).optional(),
});


const validationPrompt = ai.definePrompt({
  name: 'validateAndSuggestDataPackSlotsPrompt',
  input: { schema: ValidateDataPackInputSchema },
  // Ask for JSON, but we will validate it flexibly.
  output: { format: 'json' }, 
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert Game Designer and Prompt Engineer. Your task is to analyze a user's concept for a character generation DataPack.

  User's Concept: {{{concept}}}

  **Instructions:**
  1.  **Validate Concept:** First, determine if the concept is viable for a character generation system. Set 'isValid' to true if it is, false otherwise.
  2.  **Provide Feedback:** Give a very brief, one-sentence summary of why the concept is good or what might be challenging about it.
  3.  **Suggest Schema Slots:** This is the most important step. Based on the concept, generate a comprehensive list of schema slots (modules) that would be needed to create detailed characters within this theme.
      *   The slots should be named using snake_case (e.g., 'race_class', 'cybernetic_implants', 'signature_weapon').
      *   Include a mix of appearance slots (hair, eyes), equipment slots (torso_armor, leg_wear), and thematic slots (magical_auras, psychic_powers).
      *   Generate between 10 and 15 highly relevant slots.
  4.  **Format Output:** Your entire response must be a valid JSON object matching the required output schema.

  **Example:**
  - If the concept is "Cyberpunk Street Samurai", suggested slots might include: 'cybernetic_eyes', 'signature_katana', 'dermal_plating', 'streetwear_jacket', 'neon_backgrounds'.
  - If the concept is "High Fantasy Elven Archers", suggested slots might include: 'elven_bow_type', 'forest_cloak', 'glowing_runes', 'quiver_style', 'ancient_forest_location'.
`,
});

const validateDataPackFlow = ai.defineFlow(
  {
    name: 'validateDataPackFlow',
    inputSchema: ValidateDataPackInputSchema,
    outputSchema: ValidateDataPackOutputSchema,
  },
  async (input) => {
    const { output } = await validationPrompt(input);
    
    // The AI might return an object that doesn't perfectly match the schema.
    // We will parse it flexibly and construct a valid output object.
    const flexibleParse = FlexibleOutputSchema.safeParse(output);
    
    if (!flexibleParse.success || !flexibleParse.data.suggestedSlots) {
        throw new Error('An unexpected response was received from the server.');
    }

    const data = flexibleParse.data;

    return {
        isValid: data.isValid ?? true, // Default to true if not specified
        feedback: data.feedback || 'Concept seems viable.',
        suggestedSlots: data.suggestedSlots || [],
    };
  }
);
