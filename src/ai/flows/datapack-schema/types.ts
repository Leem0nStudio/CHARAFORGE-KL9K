
/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * The output schema now includes metadata fields (name, description, tags)
 * alongside the YAML content string.
 */

import { z } from 'zod';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


export const GenerateDataPackSchemaOutputSchema = z.object({
  name: z.string().describe("A compelling and concise name for the DataPack."),
  description: z.string().describe("A brief, one-to-two sentence description of the DataPack's theme and content."),
  tags: z.array(z.string()).describe("An array of 5-7 relevant, single-word, lowercase tags."),
  yamlContent: z.string().describe("A string containing the full DataPack schema, formatted as YAML."),
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;
