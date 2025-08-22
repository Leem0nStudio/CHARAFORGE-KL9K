
/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * The output schema is now a flat list of slots to avoid hitting API limits
 * on complex nested objects. The client is responsible for reconstructing the
 * nested structure.
 */

import { z } from 'zod';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


// Define Zod schemas that match the new types in src/types/datapack.ts
const OptionObjectSchema = z.object({
    label: z.string(),
    value: z.string(),
});

const SlotObjectSchema = z.object({
  id: z.string().describe("The unique identifier for the slot, using dot notation for nested properties (e.g., 'hair', 'torso.armor')."),
  options: z.array(OptionObjectSchema).describe("An array of options for this slot."),
});


export const GenerateDataPackSchemaOutputSchema = z.object({
  slots: z.array(SlotObjectSchema).describe("A flat list of all generated slots for the character profile."),
  tags: z.array(z.string()).describe("An array of 3-5 relevant, single-word, lowercase tags that categorize the datapack (e.g., ['fantasy', 'sci-fi', 'horror']).")
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;
