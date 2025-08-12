/**
 * @fileOverview Data schemas and types for the character biography generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import {z} from 'genkit';

export const GenerateCharacterBioInputSchema = z.object({
  description: z.string().describe('A description of the character.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the biography.'),
});
export type GenerateCharacterBioInput = z.infer<typeof GenerateCharacterBioInputSchema>;

export const GenerateCharacterBioOutputSchema = z.object({
  biography: z.string().describe('The generated biography of the character.'),
});
export type GenerateCharacterBioOutput = z.infer<typeof GenerateCharacterBioOutputSchema>;
