
/**
 * @fileOverview Data schemas and types for the DataPack schema generation flow.
 * The output schema is now a single string containing the YAML content, which
 * is more robust for the AI to generate than a complex, nested JSON object.
 */

import { z } from 'zod';

export const GenerateDataPackSchemaInputSchema = z.object({
  concept: z.string().describe('The core concept or theme for the DataPack (e.g., "cyberpunk space pirates", "lovecraftian horror investigators").'),
});
export type GenerateDataPackSchemaInput = z.infer<typeof GenerateDataPackSchemaInputSchema>;


export const GenerateDataPackSchemaOutputSchema = z.object({
  yamlContent: z.string().describe("A string containing the full DataPack schema, formatted as YAML."),
});
export type GenerateDataPackSchemaOutput = z.infer<typeof GenerateDataPackSchemaOutputSchema>;
