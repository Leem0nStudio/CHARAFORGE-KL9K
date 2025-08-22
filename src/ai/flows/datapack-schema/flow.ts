
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack schema from a concept.
 * It now generates a flat list of slots, which is then reconstructed into a nested
 * object on the client side to avoid hitting API limits for complex schemas.
 */

import { ai } from '@/ai/genkit';
import { GenerateDataPackSchemaInputSchema, GenerateDataPackSchemaOutputSchema, type GenerateDataPackSchemaInput, type GenerateDataPackSchemaOutput } from './types';


export async function generateDataPackSchema(
  input: GenerateDataPackSchemaInput
): Promise<GenerateDataPackSchemaOutput> {
  return generateDataPackSchemaFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateDataPackSchemaPrompt',
  input: { schema: GenerateDataPackSchemaInputSchema },
  output: { schema: GenerateDataPackSchemaOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert game designer and prompt engineer, specializing in creating rich, thematic character generation systems. Your task is to generate a flat list of schema slots for a character creator based on a given concept.

Concept: {{{concept}}}

Instructions:
1.  **Generate a Flat List of Slots**: Your output MUST be an array of slot objects in the 'slots' field.
2.  **Granular Slot IDs**: Each slot MUST have a unique 'id' that represents its place in the character profile. Use dot notation for equipment (e.g., 'head.clothing', 'torso.armor', 'facialFeatures', 'hair').
3.  **Rich Options**: For every single slot, you MUST provide an array of 4-6 creative and thematic options. Each option must have a 'label' for the user and a 'value' for the prompt.
4.  **Descriptive Values**: The 'value' for each option must be a descriptive phrase ready to be used in a prompt (e.g., 'long flowing silver hair', 'spiked demonic pauldrons', 'worn leather corset').
5.  **Comprehensive Coverage**: You MUST generate slots covering all major areas: general (race/class), appearance (hair, eyes, skin), a WIDE VARIETY of equipment slots (head, face, neck, shoulders, torso, arms, hands, waist, legs, feet, back) with options for clothing, armor, and accessories, and scene details (pose, action, camera, background).
6.  **Cohesion**: All generated options must be thematically consistent with the core concept.
7.  **Tags**: Finally, generate an array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., "fantasy", "sci-fi", "horror", "cyberpunk").
`,
});


const generateDataPackSchemaFlow = ai.defineFlow(
  {
    name: 'generateDataPackSchemaFlow',
    inputSchema: GenerateDataPackSchemaInputSchema,
    outputSchema: GenerateDataPackSchemaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a DataPack schema.');
    }
    return {
        slots: output.slots,
        tags: output.tags,
    };
  }
);
