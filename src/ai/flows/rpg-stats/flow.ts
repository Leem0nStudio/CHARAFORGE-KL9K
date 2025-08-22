
'use server';

/**
 * @fileOverview An AI agent for generating character RPG stats.
 * @deprecated This flow is no longer used. Stat generation is now a deterministic function
 * within the unified `rpg-attributes` flow.
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
    name: 'generateStatsFlow',
    inputSchema: GenerateStatsInputSchema,
    outputSchema: GenerateStatsOutputSchema,
  },
  async (input) => {
    const { archetype, rarity } = input;
    
    // Define stat ranges based on rarity
    const baseRanges = {
        1: { min: 5, max: 10 },   // Common
        2: { min: 7, max: 12 },   // Uncommon
        3: { min: 9, max: 14 },   // Rare
        4: { min: 11, max: 16 },  // Epic
        5: { min: 13, max: 18 },  // Legendary
    };
    const { min, max } = baseRanges[rarity];
    
    const prompt = `You are a master RPG game designer. Your task is to generate a set of D&D 5e-style ability scores (strength, dexterity, constitution, intelligence, wisdom, charisma) for a character.

    The character's archetype is: "${archetype}".
    The character's rarity is ${rarity} out of 5.

    Instructions:
    1.  Generate six ability scores.
    2.  Each score must be an integer between ${min} and ${max}, inclusive.
    3.  Distribute the scores logically based on the archetype. For example, a "Warrior" should have high strength and constitution, while a "Mage" should have high intelligence. An "Assassin" should have high dexterity.
    4.  Ensure the generated stats are balanced but reflect the character's strengths and weaknesses. Do not make all stats high.
    5.  Return ONLY the JSON object with the six stats.
    `;

    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: prompt,
        output: {
            schema: GenerateStatsOutputSchema,
        },
    });

    if (!output) {
      throw new Error('AI failed to generate stats.');
    }

    return output;
  }
);
