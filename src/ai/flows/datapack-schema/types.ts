
/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * The output schema now includes metadata fields (name, description, tags)
 * alongside the structured schema object.
 */

import { z } from 'zod';
import { DataPackSchemaSchema } from '@/types/datapack';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
  schemaSlots: z.array(z.string()).describe("A list of the specific schema slots the AI should populate."),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


// The flow now outputs a simple object with a YAML string.
export const GenerateDataPackSchemaOutputSchema = z.object({
  schemaYaml: z.string().describe("The complete DataPack definition, including metadata and schema, as a single YAML string."),
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;
