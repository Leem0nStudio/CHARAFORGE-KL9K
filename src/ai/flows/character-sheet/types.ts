
/**
 * @fileOverview Data schemas and types for the character sheet generation flow.
 */

import {z} from 'genkit';
import { TextEngineConfigSchema } from '@/types/generation';
import type { Character } from '@/types/character';

// This now imports the client-safe schema and uses it.
export { TextEngineConfigSchema };
export type { TextEngineConfig } from '@/types/generation';


export const GenerateCharacterSheetInputSchema = z.object({
  description: z.string().describe('A simple description of the character concept.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the output.'),
  engineConfig: TextEngineConfigSchema, // Use the imported client-safe schema
});
export type GenerateCharacterSheetInput = z.infer<typeof GenerateCharacterSheetInputSchema>;

export const GenerateCharacterSheetOutputSchema = z.object({
  name: z.string().describe("The character's generated name."),
  archetype: z.string().describe("The character's archetype, class, or role.").optional(),
  equipment: z.array(z.string()).describe("A list of the character's key equipment or weapons.").optional(),
  physicalDescription: z.string().describe("A detailed physical description suitable for an image prompt.").optional(),
  biography: z.string().describe("The character's detailed, narrative biography.").optional(),
  birthYear: z.string().describe("The character's generated birth year or era.").optional(),
  weaknesses: z.string().describe("A comma-separated string of character weaknesses.").optional(),
});
export type GenerateCharacterSheetOutput = z.infer<typeof GenerateCharacterSheetOutputSchema>;

    