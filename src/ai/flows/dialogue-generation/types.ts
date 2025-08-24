/**
 * @fileOverview Data schemas and types for the dialogue generation flow.
 */

import { z } from 'zod';

export const GenerateDialogueInputSchema = z.object({
  name: z.string().describe("The character's name."),
  archetype: z.string().describe("The character's archetype or class."),
  biography: z.string().describe("A detailed biography of the character to analyze their personality."),
});
export type GenerateDialogueInput = z.infer<typeof GenerateDialogueInputSchema>;


export const GenerateDialogueOutputSchema = z.object({
  dialogueLines: z
    .array(z.string())
    .describe('A list of 3-5 characteristic lines of dialogue or catchphrases for the character.'),
});
export type GenerateDialogueOutput = z.infer<typeof GenerateDialogueOutputSchema>;
