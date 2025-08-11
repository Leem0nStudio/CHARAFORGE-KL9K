
'use server';

/**
 * @fileOverview An AI agent for translating text into different languages.
 */

import {ai} from '@/ai/genkit';
import { TranslateTextInputSchema, TranslateTextOutputSchema, type TranslateTextInput, type TranslateTextOutput } from './types';


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}


const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `Translate the following text into {{targetLanguage}}.

  Maintain the original tone and style as much as possible.
  Do not add any extra commentary, introductory phrases, or explanations.
  Only output the translated text.

  Text to translate:
  {{{text}}}
  `,
});


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await translateTextPrompt(input);
    if (!output) {
      throw new Error('AI failed to translate the text.');
    }
    return output;
  }
);
