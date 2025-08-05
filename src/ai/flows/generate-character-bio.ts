'use server';

/**
 * @fileOverview Character biography generation AI agent.
 *
 * - generateCharacterBio - A function that generates a character biography from a description.
 * - GenerateCharacterBioInput - The input type for the generateCharacterBio function.
 * - GenerateCharacterBioOutput - The return type for the generateCharacterBio function.
 */

import {ai} from '../genkit'; // Changed from '@/ai/genkit'
import {z} from 'genkit';

const GenerateCharacterBioInputSchema = z.object({
  description: z.string().describe('A description of the character.'),
});
export type GenerateCharacterBioInput = z.infer<typeof GenerateCharacterBioInputSchema>;

const GenerateCharacterBioOutputSchema = z.object({
  biography: z.string().describe('The generated biography of the character.'),
});
export type GenerateCharacterBioOutput = z.infer<typeof GenerateCharacterBioOutputSchema>;

export async function generateCharacterBio(input: GenerateCharacterBioInput): Promise<GenerateCharacterBioOutput> {
  return generateCharacterBioFlow(input);
}

const generateCharacterBioPrompt = ai.definePrompt({
  name: 'generateCharacterBioPrompt',
  input: {schema: GenerateCharacterBioInputSchema},
  output: {schema: GenerateCharacterBioOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a professional writer specializing in character biographies.

  Based on the provided description, generate a detailed and engaging biography for the character.

  Description: {{{description}}}`,
});

const generateCharacterBioFlow = ai.defineFlow(
  {
    name: 'generateCharacterBioFlow',
    inputSchema: GenerateCharacterBioInputSchema,
    outputSchema: GenerateCharacterBioOutputSchema,
  },
  async input => {
    const {output} = await generateCharacterBioPrompt(input);
    return output!;
  }
);
