
'use server';

/**
 * @fileOverview An AI agent for translating text into different languages.
 * This flow is now data-driven and can use different AI engines.
 */

import {ai} from '@/ai/genkit';
import { queryLlm } from '@/ai/utils/llm-utils';
import { 
  TranslateTextInputSchema, 
  TranslateTextOutputSchema, 
  type TranslateTextInput, 
  type TranslateTextOutput 
} from './types';


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { text, targetLanguage, engineConfig } = input;
    
    const prompt = `Translate the following text into ${targetLanguage}.

    Maintain the original tone and style as much as possible.
    Do not add any extra commentary, introductory phrases, or explanations.
    Only output the translated text.
  
    Text to translate:
    ${text}`;
    
    const output = await queryLlm(
        engineConfig,
        prompt,
        TranslateTextOutputSchema
    );

    if (!output) {
      throw new Error('AI failed to translate the text.');
    }
    return output;
  }
);
