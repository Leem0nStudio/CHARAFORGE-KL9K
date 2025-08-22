
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack (metadata and schema) from a concept.
 * It now generates a complete YAML file as a string for the schema, plus metadata fields.
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
  prompt: `You are an expert game designer and prompt engineer. Your task is to generate a complete DataPack, including metadata and a YAML schema, based on a user's concept.

Concept: {{{concept}}}

Instructions:
1.  **Name**: Generate a short, compelling, and marketable name for the DataPack.
2.  **Description**: Write a concise, one-to-two sentence description that explains the theme and purpose of the DataPack.
3.  **Tags**: Generate an array of 5-7 relevant, single-word, lowercase tags that categorize the datapack.
4.  **YAML Content**: Your entire YAML output MUST be a single, valid YAML document string within the 'yamlContent' field. Do NOT include any other text or explanations outside of the YAML content.
    *   **CRITICAL - COMPLETE ALL SECTIONS**: You MUST generate thematically appropriate options for ALL of the following sections and their sub-sections: General (raceClass, gender), Appearance (hair, eyes), ALL equipment slots (head, torso, legs, feet, hands, etc.), and Scene (pose, background, effects). Do not leave any section empty.
    *   **Prompt Templates**: Generate 2-3 diverse 'promptTemplates'. Each template should use placeholders (e.g., {raceClass}, {torso_armor}) that correspond to the slots you will define.
    *   **Character Profile Schema**:
        *   **GRANULARITY IS KEY**: You MUST create separate, granular slots for different parts of the character, especially for clothing. Instead of one 'clothing' slot, you MUST create specific slots like 'headwear', 'topwear', 'bottomwear', 'footwear', etc.
        *   For EVERY slot, provide 4-5 creative, thematically consistent options.
        *   Each option MUST have a 'label' for the UI and a 'value' for the prompt.
        *   **CRITICAL**: The 'value' for each option MUST be a single, concise line of text. Do NOT use multi-line strings for values.
    *   **Mandatory Archetype Slot**: It is MANDATORY that one of the slots you generate is for the character's class or archetype (e.g., id: 'raceClass', 'class', or 'role'), as this is required by the game system.

Example YAML structure:
promptTemplates:
  - name: "Cinematic Portrait"
    template: "cinematic portrait of a {raceClass} with {hair}, {eyes}, wearing {torso_armor} and {head_accessory}, in {background}, {lighting} lighting"
  - name: "Action Shot"
    template: "dynamic action shot of a {raceClass}, {action}, wielding a {hands_weapon}, wearing {torso_armor}, in {background}"
characterProfileSchema:
  raceClass:
    - label: "Solar Knight"
      value: "a noble solar knight"
    - label: "Void Warlock"
      value: "a mysterious void warlock"
  hair:
    - label: "Flowing White"
      value: "long flowing white hair"
    - label: "Short & Spiky"
      value: "short, spiky black hair"
  # ... and so on for many other slots
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
    if (!output || !output.yamlContent) {
      throw new Error('AI failed to generate a valid YAML content for the DataPack schema.');
    }
    return output;
  }
);
