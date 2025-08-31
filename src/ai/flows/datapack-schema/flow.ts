
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack (metadata and schema) from a concept.
 * It now generates a complete JSON object matching the output schema directly, improving reliability.
 */

import { ai } from '@/ai/genkit';
import { GenerateDataPackSchemaInputSchema, GenerateDataPackSchemaOutputSchema, type GenerateDataPackSchemaInput, type GenerateDataPackSchemaOutput } from './types';
import yaml from 'js-yaml';


export async function generateDataPackSchema(
  input: GenerateDataPackSchemaInput
): Promise<GenerateDataPackSchemaOutput> {
  return generateDataPackSchemaFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateDataPackSchemaPrompt',
  input: { schema: GenerateDataPackSchemaInputSchema },
  output: { format: 'yaml' }, // Ask for YAML, which is less strict than the model
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a world-class expert in prompt engineering for high-quality image generation and a lead game designer. Your task is to generate a complete, professional-grade DataPack as a YAML string, including all metadata and a detailed schema, based on a user's core concept and a pre-defined list of schema slots.

Concept: {{{concept}}}

Schema Slots to Populate:
{{#each schemaSlots}}
- {{this}}
{{/each}}

**CRITICAL INSTRUCTIONS FOR QUALITY:**
Your output must be flawless and adhere to these rules. Your entire response MUST be a single, valid YAML document based on the template below. DO NOT wrap it in markdown backticks or add any commentary.

**YOUR TASK:**
Fill out every single field in the following YAML template based on the provided concept and the required schema slots.

1.  **Metadata:**
    *   **name:** Generate a short, compelling, marketable name for the concept.
    *   **description:** Write a concise, one-to-two sentence description.
    *   **tags:** Generate an array of 5-7 relevant, single-word, lowercase tags.

2.  **Schema Content:**
    *   **promptTemplates:** MUST generate 2-3 diverse and detailed templates using placeholders that correspond to the slots you are populating (e.g., {torso_clothing}, {hands_weapon}).
    *   **characterProfileSchema (MOST IMPORTANT):**
        *   **FILL THE REQUESTED SLOTS:** You MUST generate thematically appropriate options for EVERY slot provided in the 'Schema Slots to Populate' list.
        *   **RICH VALUES:** Every option's 'value' field MUST be a descriptive, multi-word phrase suitable for a high-quality image prompt.
        *   **GENERATE 4-6 OPTIONS PER SLOT.** Do not generate slots that were not requested.

---
**YAML TEMPLATE TO FILL (Use the requested slots for the characterProfileSchema keys):**

name: "Generated DataPack Name"
description: "Generated description."
tags:
  - tag1
  - tag2
  - tag3
schema:
  promptTemplates:
    - name: "Full Body Scene"
      template: "{raceClass}, {hair}, wearing {torso_clothing} and {legs_clothing}, {action}, in a {background}"
    - name: "Cinematic Portrait"
      template: "cinematic portrait of a {raceClass} with {hair}, {expression}, wearing {torso_armor}, {lighting}"
  characterProfileSchema:
    # Example for a requested 'raceClass' slot. Populate this section with the requested slots.
    raceClass:
      - label: "Generated Archetype 1"
        value: "detailed description for archetype 1"
      - label: "Generated Archetype 2"
        value: "detailed description for archetype 2"
    # Example for a requested 'hair' slot.
    hair:
      - label: "Hair Style 1"
        value: "long flowing red hair"
      - label: "Hair Style 2"
        value: "short spiky blue hair"
`,
});


const generateDataPackSchemaFlow = ai.defineFlow(
  {
    name: 'generateDataPackSchemaFlow',
    inputSchema: GenerateDataPackSchemaInputSchema,
    outputSchema: GenerateDataPackSchemaOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
        try {
            const { output: rawOutput } = await prompt(input);

            if (!rawOutput) {
              throw new Error('AI failed to generate any schema content.');
            }

            let yamlString: string;
            
            if (typeof rawOutput === 'object') {
              yamlString = yaml.dump(rawOutput);
            } else if (typeof rawOutput === 'string') {
              yamlString = rawOutput.replace(/^```(yaml|YAML)?\s*|```$/g, '').trim();
            } else {
              console.error("AI returned a non-string/non-object value for YAML, which is invalid.", rawOutput);
              throw new Error(`AI generation failed. Expected a YAML string or object, but received a ${typeof rawOutput}.`);
            }
            
            try {
                yaml.load(yamlString);
            } catch (e) {
                const parseError = e instanceof Error ? e.message : "Unknown YAML parsing error";
                console.error("AI returned invalid YAML.", parseError);
                throw new Error(`AI failed to generate valid YAML: ${parseError}`);
            }
            
            return { schemaYaml: yamlString };

        } catch (error) {
            attempts++;
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            
            if (errorMessage.includes("AI failed to generate valid YAML")) {
                throw error;
            }

            if (attempts < MAX_RETRIES) {
                console.warn(`Attempt ${attempts}/${MAX_RETRIES} failed for DataPack generation. Retrying in ${attempts * 1500}ms... Error: ${errorMessage}`);
                await new Promise(resolve => setTimeout(resolve, attempts * 1500)); 
            } else {
                console.error(`Final attempt failed after ${MAX_RETRIES} retries. Error: ${errorMessage}`);
                throw new Error("The AI model is currently overloaded or failing to respond. Please try again later.");
            }
        }
    }
    
    throw new Error("The AI model is currently overloaded. Please try again later after all retry attempts.");
  }
);
