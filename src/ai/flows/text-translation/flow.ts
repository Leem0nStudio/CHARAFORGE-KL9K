
'use server';

/**
 * @fileOverview An AI agent for translating text into different languages.
 * This flow is now data-driven and can use different AI engines.
 */

import {ai} from '@/ai/genkit';
import type { GenerationCommonOptions } from 'genkit/ai';
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
    const { engineId, modelId, userApiKey } = engineConfig;
    
    const prompt = `Translate the following text into ${targetLanguage}.

    Maintain the original tone and style as much as possible.
    Do not add any extra commentary, introductory phrases, or explanations.
    Only output the translated text.
  
    Text to translate:
    ${text}`;
    
    let requestConfig: GenerationCommonOptions = {};
  
    // For OpenRouter, we must supply the API key and explicitly set the provider.
    if (engineId === 'openrouter') {
      const systemApiKey = process.env.OPENROUTER_API_KEY;
      const apiKey = userApiKey || systemApiKey;

      if (!apiKey) {
        throw new Error(`OpenRouter API key is not configured on the server or provided by the user.`);
      }
      
      requestConfig = {
          apiKey,
          provider: 'openai',
      };
    }

    const { output } = await ai.generate({
        model: modelId,
        prompt: prompt,
        output: {
            schema: TranslateTextOutputSchema,
        },
        config: requestConfig,
    });
    

    if (!output) {
      throw new Error('AI failed to translate the text.');
    }
    return output;
  }
);
