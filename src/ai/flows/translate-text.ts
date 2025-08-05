'use server';

/**
 * @fileOverview An AI agent for translating text into different languages.
 *
 * - translateText - A function that handles text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.enum(['Spanish', 'French', 'German']).describe('The target language for translation.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The resulting translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


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
