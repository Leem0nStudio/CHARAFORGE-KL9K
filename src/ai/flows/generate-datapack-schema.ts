
'use server';

/**
 * @fileOverview An AI agent for generating a complete DataPack schema from a concept.
 *
 * - generateDataPackSchema - A function that handles the schema generation process.
 * - GenerateDataPackSchemaInput - The input type for the function.
 * - GenerateDataPackSchemaOutput - The return type for the function (matches DataPackSchema structure).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


// Define Zod schemas that match the types in src/types/datapack.ts
const ExclusionSchema = z.object({
    slotId: z.string().describe("The 'id' of the slot to which the exclusion applies."),
    optionValues: z.array(z.string()).describe("The 'value's of the options to be disabled in the target slot."),
});

const OptionSchema = z.object({
    label: z.string().describe("The user-facing name for this option (e.g., 'Chainmail Armor')."),
    value: z.string().describe("The value to be inserted into the prompt template (e.g., 'chainmail armor')."),
    exclusions: z.array(ExclusionSchema).optional().describe("A list of other options that this option is incompatible with."),
});

const SlotSchema = z.object({
    id: z.string().min(1).describe("A unique, snake_case identifier for this slot (e.g., 'armor_torso')."),
    label: z.string().min(1).describe("The user-facing name for this category (e.g., 'Torso Armor')."),
    type: z.enum(['text', 'select']).default('select').describe("The type of input. 'select' for a list of options, 'text' for free-form input."),
    options: z.array(OptionSchema).optional().describe("A list of choices for this slot. Required if type is 'select'."),
    defaultOption: z.string().optional().describe("The default 'value' to be pre-selected for this slot."),
    placeholder: z.string().optional().describe("Placeholder text for 'text' type inputs."),
});

const GenerateDataPackSchemaOutputSchema = z.object({
  promptTemplate: z.string().describe("A detailed Handlebars-style prompt template string. It must include placeholders for all defined slot IDs, e.g., 'A {style} portrait of a {race} {class}.'."),
  slots: z.array(SlotSchema).describe("An array of 7-10 diverse and creative slot objects that define the customizable options for the DataPack."),
  tags: z.array(z.string()).describe("An array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., ['fantasy', 'sci-fi', 'horror']).")
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;


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
    *   For at least one or two slots, try to include an 'exclusions' rule to show logical dependencies (e.g., a 'Mage' class shouldn't be able to select 'Heavy Plate Armor').
    *   You can include a 'text' type slot for things like a character's name.
    *   Set a sensible 'defaultOption' for each slot, referencing one of the option 'value's.
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

    