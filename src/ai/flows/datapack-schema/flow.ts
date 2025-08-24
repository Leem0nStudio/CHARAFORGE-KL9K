
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
  prompt: `You are a world-class expert in prompt engineering for high-quality image generation and a lead game designer. Your task is to generate a complete, professional-grade DataPack, including all metadata and a detailed YAML schema, based on a user's core concept.

Concept: {{{concept}}}

**CRITICAL INSTRUCTIONS FOR QUALITY:**
Your output must be flawless and adhere to these rules. Failure to do so results in a poor user experience.

1.  **Metadata Generation:**
    *   **Name:** Generate a short, compelling, and marketable name for the DataPack.
    *   **Description:** Write a concise, one-to-two sentence description that explains the theme and purpose of the DataPack.
    *   **Tags:** Generate an array of 5-7 relevant, single-word, lowercase tags that categorize the datapack.

2.  **YAML Content Generation (The Core Task):**
    *   The 'yamlContent' field MUST contain a single, valid YAML document string. Do not include any other text or explanations outside of the YAML content itself.
    *   **Prompt Templates:**
        *   You MUST generate 2-3 diverse and highly detailed 'promptTemplates'.
        *   Each template MUST use a wide variety of placeholders (e.g., {raceClass}, {torso_armor}, {head_accessory}, {legs_clothing}, etc.) that correspond to the slots you will define below.
    *   **Character Profile Schema (Prompt Engineering Best Practices):**
        *   **FULL COMPLETION IS MANDATORY:** You MUST generate thematically appropriate options for EVERY SECTION AND SUB-SECTION listed below. Do NOT leave any section empty. This includes all equipment slots from head to feet.
        *   **GRANULARITY IS KEY**: You MUST use the provided granular slot structure. For equipment, this means defining options for 'head', 'torso', 'legs', 'feet', 'hands', etc., each with sub-categories like 'clothing', 'armor', 'accessory'.
        *   **RICH DESCRIPTIVE VALUES (MOST IMPORTANT RULE):** For every option, the 'value' field MUST be a descriptive, multi-word phrase suitable for a high-quality image prompt. DO NOT use single words. Good examples: "ornate obsidian plate armor", "tattered shadow robes with glowing runes", "long flowing white hair with silver clasps". Bad examples: "armor", "robes", "hair". Each 'value' must add significant visual detail.
        *   **THEMATIC CONSISTENCY:** All generated options, from race to background, must be perfectly aligned with the user's initial 'concept'.
        *   **MANDATORY ARCHETYPE SLOT:** It is MANDATORY that one of the primary slots is for the character's class or archetype (e.g., 'raceClass', 'class', or 'role'), as this is a cornerstone of character creation.
        *   **PROVIDE 4-5 OPTIONS PER SLOT/SUB-SLOT.**

Example of a high-quality YAML structure for a "Solar Knight" concept:
'''yaml
promptTemplates:
  - name: "Cinematic Portrait"
    template: "cinematic portrait of a {raceClass} with {hair}, {eyes}, wearing {torso_armor} and {head_accessory}, in {background}, {effects} lighting"
  - name: "Action Shot"
    template: "dynamic action shot of a {raceClass}, {action}, wielding a {hands_weapon}, wearing {torso_armor} and {legs_clothing}, in {background}"
characterProfileSchema:
  raceClass:
    - label: "Solar Knight"
      value: "a noble solar knight with faint glowing skin"
    - label: "Void Warlock"
      value: "a mysterious void warlock clad in shadowy silks"
    - label: "Sunstone Templar"
      value: "a sunstone templar in inscribed golden armor"
  hair:
    - label: "Flowing White"
      value: "long flowing white hair made of pure light"
    - label: "Short & Spiky"
      value: "short, spiky black hair that absorbs light"
  torso:
    armor:
      - label: "Obsidian Plate"
        value: "ornate, polished obsidian plate armor with gold filigree"
      - label: "Shadow Robes"
        value: "tattered, multi-layered shadow robes with glowing purple runes"
  head:
    accessory:
      - label: "Horned Helmet"
        value: "a large, imposing horned helmet with intricate carvings"
      - label: "Simple Blindfold"
        value: "a simple black silk blindfold covering the eyes"
  # ... and so on for ALL other slots (legs, feet, hands, background, pose, etc.)
'''
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
