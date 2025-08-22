
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack schema from a concept,
 * now updated to generate a structured CharacterProfileSchema for granular control.
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
  prompt: `You are an expert game designer and prompt engineer, specializing in creating rich, thematic character generation systems. Your task is to generate a complete DataPack schema for a character creator based on a given concept.

The output must be a valid JSON object matching the provided schema, containing a 'characterProfileSchema' and 'tags'.

Concept: {{{concept}}}

Instructions:
1.  **characterProfileSchema**: First, generate the main schema object. You must populate every field within this schema, from 'count' and 'raceClass' to all the equipment slots like 'head', 'torso', 'legs', etc., and scene details like 'camera' and 'background'.
2.  **GRANULARITY IS KEY**: For each equipment slot (e.g., 'head', 'torso', 'shoulders'), you MUST provide a variety of options for 'clothing', 'armor', and 'accessories' relevant to that body part. This is critical for modularity.
3.  **Rich Options**: For every single field and sub-field (e.g., 'hair', 'eyes', 'head.clothing', 'torso.armor'), you MUST provide an array of 4-6 creative and thematic options. Each option must have a 'label' for the user and a 'value' for the prompt.
4.  **Descriptive Values**: The 'value' for each option must be a descriptive phrase ready to be used in a prompt (e.g., 'long flowing silver hair', 'spiked demonic pauldrons', 'worn leather corset', 'ornate iron choker').
5.  **Cohesion**: All generated options must be thematically consistent with the core concept. For example, a "Cyberpunk Mercenary" pack should have options like "cybernetic eyes" and "armored trench coat", not "elven circlet".
6.  **Tags**: Finally, generate an array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., "fantasy", "sci-fi", "horror", "cyberpunk").
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
    // For backward compatibility, we can wrap the new schema inside the old structure if needed,
    // but for now, we'll return the new structure directly as defined in types.
    return {
        characterProfileSchema: output.characterProfileSchema,
        tags: output.tags,
    };
  }
);
