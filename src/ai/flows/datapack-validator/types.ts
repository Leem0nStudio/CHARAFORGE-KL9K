
import { z } from 'zod';

export const ValidateDataPackInputSchema = z.object({
  concept: z.string().describe('The user-provided concept for the DataPack.'),
});

export const ValidateDataPackOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the concept is viable for a character generation pack.'),
  feedback: z.string().describe('A concise, one-sentence summary of the concept\'s strengths or weaknesses.'),
  suggestedSlots: z.array(z.string()).describe('A list of 10-15 recommended schema slot names in snake_case (e.g., "cybernetic_eyes").'),
});

export type ValidateDataPackInput = z.infer<typeof ValidateDataPackInputSchema>;
export type ValidateDataPackOutput = z.infer<typeof ValidateDataPackOutputSchema>;
