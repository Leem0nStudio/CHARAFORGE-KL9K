
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack schema from a concept.
 * It now generates a complete YAML file as a string, which is more robust and flexible
 * for the AI than generating a complex JSON object.
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
  prompt: `You are an expert game designer and prompt engineer. Your task is to generate a complete DataPack schema as a single YAML document based on a user's concept.

Concept: {{{concept}}}

Instructions:
1.  **YAML Output**: Your entire output MUST be a single, valid YAML document string within the 'yamlContent' field. Do NOT include any other text or explanations outside of the YAML content.
2.  **Prompt Templates**: Generate 2-3 diverse 'promptTemplates'. Each template should use placeholders (e.g., {raceClass}, {torso_armor}) that correspond to the slots you will define in the 'characterProfileSchema'.
3.  **Character Profile Schema**:
    *   Create a rich 'characterProfileSchema' with many granular slots for appearance and equipment.
    *   **GRANULARITY IS KEY**: You MUST create separate, granular slots for different parts of the character, especially for clothing. Instead of one 'clothing' slot, you MUST create specific slots like 'headwear', 'topwear', 'bottomwear', 'footwear', etc.
    *   For EVERY slot, provide 4-5 creative, thematically consistent options.
    *   Each option MUST have a 'label' for the UI and a 'value' for the prompt.
    *   **CRITICAL**: The 'value' for each option MUST be a single, concise line of text. Do NOT use multi-line strings for values.
4.  **Mandatory Archetype Slot**: It is MANDATORY that one of the slots you generate is for the character's class or archetype (e.g., id: 'raceClass', 'class', or 'role'), as this is required by the game system. Provide options like "Warrior", "Mage", "Rogue", etc.
5.  **Tags**: Generate an array of 5-7 relevant, single-word, lowercase tags that categorize the datapack.

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
  eyes:
    - label: "Glowing Blue"
      value: "glowing blue eyes"
    - label: "Piercing Amber"
      value: "piercing amber eyes"
  torso_armor:
    - label: "Sunforged Plate"
      value: "ornate sunforged plate armor"
    - label: "Shadow-Woven Robes"
      value: "dark, shadow-woven robes"
  head_accessory:
    - label: "Laurel Crown"
      value: "a golden laurel crown"
    - label: "Horned Circlet"
      value: "a horned, dark iron circlet"
  # ... and so on for many other slots
tags: ["fantasy", "magic", "knights", "warlocks", "epic"]
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
    return {
        yamlContent: output.yamlContent,
    };
  }
);
