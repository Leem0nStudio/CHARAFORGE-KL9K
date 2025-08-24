

'use server';

/**
 * @fileOverview An AI agent for generating character RPG stats.
 * @deprecated This flow is no longer used. Stat generation is now a deterministic function
 * in `character-write.ts` and skill generation is handled by a new dedicated server action
 * called by a Cloud Function.
 */
import { ai } from '@/ai/genkit';
import { 
  GenerateStatsInputSchema, 
  GenerateStatsOutputSchema, 
  type GenerateStatsInput, 
  type GenerateStatsOutput 
} from './types';


export async function generateCharacterStats(input: GenerateStatsInput): Promise<GenerateStatsOutput> {
  return generateStatsFlow(input);
}


export const generateStatsFlow = ai.defineFlow(
  {
    name: 'generateStatsFlow_DEPRECATED',
    inputSchema: GenerateStatsInputSchema,
    outputSchema: GenerateStatsOutputSchema,
  },
  async (input) => {
    throw new Error('This flow is deprecated and should not be called. Stat generation is now deterministic and skill generation is a separate process.');
  }
);

  