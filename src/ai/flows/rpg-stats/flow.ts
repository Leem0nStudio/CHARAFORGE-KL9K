

'use server';

/**
 * @fileOverview An AI agent for generating character RPG stats.
 * @deprecated This flow is no longer used. Stat generation is now a deterministic function
 * in `character-write.ts` when an archetype is assigned or changed.
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
    throw new Error('This flow is deprecated and should not be called. Stat generation is now a deterministic function in `character-write.ts`.');
  }
);
