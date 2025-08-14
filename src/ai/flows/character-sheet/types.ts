
/**
 * @fileOverview Data schemas and types for the character sheet generation flow.
 */

import {z} from 'genkit';

// This is the configuration for any text-generation engine.
export const TextEngineConfigSchema = z.object({
  engineId: z.enum(['gemini', 'openrouter']).describe('The generation engine to use.'),
  modelId: z.string().describe('The identifier for the base model (e.g., "googleai/gemini-1.5-flash-latest" or "openai/gpt-4o").'),
  userApiKey: z.string().optional().describe("An optional, user-provided API key for the selected engine."),
});
export type TextEngineConfig = z.infer<typeof TextEngineConfigSchema>;

export const GenerateCharacterSheetInputSchema = z.object({
  description: z.string().describe('A simple description of the character concept.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the output.'),
  engineConfig: TextEngineConfigSchema.describe('The configuration for the text generation engine.'),
});
export type GenerateCharacterSheetInput = z.infer<typeof GenerateCharacterSheetInputSchema>;

export const GenerateCharacterSheetOutputSchema = z.object({
  name: z.string().describe("The character's generated name."),
  archetype: z.string().describe("The character's archetype, class, or role."),
  equipment: z.array(z.string()).describe("A list of the character's key equipment or weapons."),
  physicalDescription: z.string().describe("A detailed physical description suitable for an image prompt."),
  biography: z.string().describe("The character's detailed, narrative biography."),
});
export type GenerateCharacterSheetOutput = z.infer<typeof GenerateCharacterSheetOutputSchema>;

    