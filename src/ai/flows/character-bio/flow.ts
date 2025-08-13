'use server';

/**
 * @fileOverview Character biography generation AI agent.
 * This flow is now data-driven and can use different AI engines.
 */

import { ai } from '@/ai/genkit';
import { queryLlm } from '@/ai/utils/llm-utils';
import { 
  GenerateCharacterBioInputSchema, 
  GenerateCharacterBioOutputSchema, 
  type GenerateCharacterBioInput, 
  type GenerateCharacterBioOutput 
} from './types';


export async function generateCharacterBio(input: GenerateCharacterBioInput): Promise<GenerateCharacterBioOutput> {
  return generateCharacterBioFlow(input);
}


const generateCharacterBioFlow = ai.defineFlow(
  {
    name: 'generateCharacterBioFlow',
    inputSchema: GenerateCharacterBioInputSchema,
    outputSchema: GenerateCharacterBioOutputSchema,
  },
  async (input) => {
    const { description, targetLanguage, engineConfig } = input;

    const prompt = `You are a professional writer specializing in character biographies.

    Based on the provided description, generate a detailed and engaging biography for the character.
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}.` : 'The biography MUST be written in English.'}
  
    Description: ${description}`;

    const output = await queryLlm(
        engineConfig,
        prompt,
        GenerateCharacterBioOutputSchema
    );
    
    // The schema now expects `biography`, but the LLM utility might return a different structure.
    // We need to ensure the final return value matches the GenerateCharacterBioOutputSchema.
    // Assuming queryLlm returns an object with a 'biography' field as per its Zod schema.
    return {
      biography: (output as any).biography || ''
    };
  }
);
