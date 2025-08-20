
/**
 * @fileOverview Data schemas and types for the character sheet generation flow.
 */

import {z} from 'genkit';
import type { TextEngineConfig } from '@/types/generation';

// This is now just a re-export for the server-side flow.
// The client will import directly from '@/types/generation'.
export type { TextEngineConfig };


export const GenerateCharacterSheetInputSchema = z.object({
  description: z.string().describe('A simple description of the character concept.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the output.'),
  engineConfig: z.custom<TextEngineConfig>().describe('The configuration for the text generation engine.'),
});
export type GenerateCharacterSheetInput = z.infer<typeof GenerateCharacterSheetInputSchema>;

export const GenerateCharacterSheetOutputSchema = z.object({
  name: z.string().describe("The character's generated name."),
  archetype: z.string().describe("The character's archetype, class, or role.").optional(),
  equipment: z.array(z.string()).describe("A list of the character's key equipment or weapons.").optional(),
  physicalDescription: z.string().describe("A detailed physical description suitable for an image prompt.").optional(),
  biography: z.string().describe("The character's detailed, narrative biography.").optional(),
});
export type GenerateCharacterSheetOutput = z.infer<typeof GenerateCharacterSheetOutputSchema>;

    