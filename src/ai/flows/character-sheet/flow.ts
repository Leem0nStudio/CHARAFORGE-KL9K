
'use server';

/**
 * @fileOverview Character sheet generation AI agent.
 * This flow generates a structured character sheet from a simple description.
 */
import { ai } from '@/ai/genkit';
import type { GenerationCommonOptions } from 'genkit/ai';
import { 
  GenerateCharacterSheetInputSchema, 
  GenerateCharacterSheetOutputSchema, 
  type GenerateCharacterSheetInput, 
  type GenerateCharacterSheetOutput 
} from './types';


export async function generateCharacterSheet(input: GenerateCharacterSheetInput): Promise<GenerateCharacterSheetOutput> {
  return generateCharacterSheetFlow(input);
}


const generateCharacterSheetFlow = ai.defineFlow(
  {
    name: 'generateCharacterSheetFlow',
    inputSchema: GenerateCharacterSheetInputSchema,
    outputSchema: GenerateCharacterSheetOutputSchema,
  },
  async (input) => {
    const { description, targetLanguage, engineConfig } = input;
    const { engineId, modelId, userApiKey } = engineConfig;
    
    let requestConfig: GenerationCommonOptions = {};
  
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

    const prompt = `You are a professional writer and game master specializing in creating rich character details. Your task is to generate a complete character sheet from a user's description.

    Based on the provided description, generate all the required fields.
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}. All other fields should also be translated.` : 'All fields MUST be written in English.'}

    Description: """
    ${description}
    """
    
    Instructions for each field:
    - name: A fitting and creative name for the character.
    - archetype: A one or two-word class, role, or archetype (e.g., "Grizzled Detective", "Cyber-Sorcerer", "Starship Captain").
    - equipment: A list of 3-5 key items, weapons, or gear the character possesses.
    - physicalDescription: A detailed, one-paragraph description focusing only on the character's visual appearance, clothing, and gear. This will be used for an image generation prompt, so be descriptive and evocative.
    - biography: A detailed, multi-paragraph biography exploring the character's backstory, personality, and motivations. Make it engaging and narrative-driven.
    `;

    const { output } = await ai.generate({
        model: modelId,
        prompt: prompt,
        output: {
            schema: GenerateCharacterSheetOutputSchema,
        },
        config: requestConfig,
    });
    
    if (!output) {
      throw new Error('AI failed to generate a character sheet.');
    }

    return output;
  }
);
