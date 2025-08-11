
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack schema from a concept.
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
  prompt: `You are an expert game designer and world-builder, specializing in creating rich, thematic character generation systems. Your task is to generate a complete DataPack schema for a character creator based on a given concept.

The output must be a valid JSON object matching the provided schema, with a 'promptTemplate', a 'slots' array, and a 'tags' array.

Concept: {{{concept}}}

Instructions:
1.  **Prompt Template**: Create a detailed and descriptive prompt template. It MUST use placeholders in the format '{slot_id}' for every single slot you define in the 'slots' array. The template should combine the slots to form a coherent, high-quality image generation prompt.
2.  **Slots**: Generate an array of 7 to 10 diverse and creative slots.
    *   Each slot must have a unique 'id' in snake_case.
    *   Each slot must have a user-friendly 'label'.
    *   For each 'select' slot, provide a list of 4-6 creative and thematic 'options'.
    *   Each option must have a 'label' for the UI and a 'value' to be used in the prompt. The value should be lowercase.
    *   **Locking Core Attributes**: Identify 1-2 slots that are absolutely essential to the core identity of the concept (e.g., for "Vampire Noble", the 'race' slot should be locked to 'vampire'). For these slots, set \`isLocked: true\`. These locked slots will use their \`defaultOption\` in the prompt but won't be configurable by the end-user.
    *   You can include a 'text' type slot for things like a character's name.
    *   Set a sensible 'defaultOption' for every single slot, referencing one of the option 'value's.
3.  **Tags**: Based on the concept, generate an array of 3-5 relevant, single-word, lowercase tags that categorize the datapack. Examples: "fantasy", "sci-fi", "horror", "cyberpunk", "post-apocalyptic", "anime".
4.  **Creativity**: Be imaginative! The options should be evocative and fit the theme. Think about appearance, equipment, background, and mood. Avoid generic fantasy tropes unless the concept calls for it. Ensure the generated content is unique and compelling.
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
    return output;
  }
);
