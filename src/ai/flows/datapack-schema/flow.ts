
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
  prompt: `You are an expert game designer and prompt engineer, specializing in creating rich, thematic character generation systems. Your task is to generate a complete DataPack schema for a character creator based on a given concept.

The output must be a valid JSON object matching the provided schema, with 'promptTemplates', 'slots', and 'tags'.

Concept: {{{concept}}}

Instructions:
1.  **Slots**: First, generate an array of 7 to 10 diverse and creative slots that represent the core components of the concept.
    *   **GRANULARITY IS KEY**: You MUST create separate, granular slots for different parts of the character, especially for clothing. Instead of one "clothing" slot, you MUST create specific slots like "headwear", "topwear", "bottomwear", "footwear", "shoulders", etc.
    *   **RPG COMPATIBILITY**: It is mandatory that one of the slots represents the character's **class or archetype** (e.g., with an \`id\` of "class", "role", or "archetype"). The options for this slot should be relevant fantasy/sci-fi classes like "Warrior", "Mage", "Bounty Hunter", etc.
    *   Each slot must have a unique 'id' in snake_case.
    *   Each slot must have a user-friendly 'label'.
    *   For each 'select' slot, provide a list of 4-6 creative and thematic 'options'.
    *   The 'value' for each option MUST be a coherent and ready-to-use descriptive phrase (e.g., "wearing a leather jacket", "cybernetic glowing eyes", "in a rain-slicked alley"), not just a single word.
    *   **Locking Core Attributes**: Identify 1-2 slots that are absolutely essential to the core identity of the concept (e.g., for "Vampire Noble", the 'race' slot should be locked to 'vampire'). For these slots, set \`isLocked: true\`.
    *   Set a sensible 'defaultOption' for every single slot, referencing one of the option 'value's.

2.  **Prompt Templates**: After defining the slots, generate an array of 3 to 5 diverse prompt templates.
    *   Each template object must have a short, descriptive 'name' (e.g., "Cinematic Portrait", "Action Shot").
    *   Each 'template' string MUST be a comma-separated list of tags and phrases that follows this exact, detailed structure:
        **1girl, {facial_details}, {body_type}, {headwear}, {topwear}, {bottomwear}, {footwear}, {action_pose}, {camera_angle}, {background_location}, {style_details}**
    *   You MUST use placeholders in the format '{slot_id}' that correspond to the granular slots you defined in step 1. Every single slot you defined must be used in at least one template.
    *   Be creative and ensure the combination of slots makes sense within the structured prompt.

3.  **Tags**: Based on the concept, generate an array of 3-5 relevant, single-word, lowercase tags that categorize the datapack. Examples: "fantasy", "sci-fi", "horror", "cyberpunk", "post-apocalyptic", "anime".
4.  **Creativity & Cohesion**: Be imaginative! The options should be evocative and fit the theme. Think about appearance, equipment, background, and mood. Avoid generic fantasy tropes unless the concept calls for it. Ensure the generated content is unique and compelling.
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
    
