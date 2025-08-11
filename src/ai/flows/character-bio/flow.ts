'use server';

/**
 * @fileOverview Character biography generation AI agent.
 */

import {ai} from '@/ai/genkit';
import { GenerateCharacterBioInputSchema, GenerateCharacterBioOutputSchema, type GenerateCharacterBioInput, type GenerateCharacterBioOutput } from './types';


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
  
  {{#if targetLanguage}}
  IMPORTANT: The biography MUST be written in {{targetLanguage}}.
  {{else}}
  The biography MUST be written in English.
  {{/if}}

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
