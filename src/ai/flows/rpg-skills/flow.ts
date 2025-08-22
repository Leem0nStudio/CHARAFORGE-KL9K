

'use server';

/**
 * @fileOverview An AI agent for generating character RPG skills.
 * @deprecated This flow is now part of the unified `rpg-attributes` flow and will be removed.
 */
import { ai } from '@/ai/genkit';
import { 
  GenerateSkillsInputSchema, 
  GenerateSkillsOutputSchema, 
  type GenerateSkillsInput, 
  type GenerateSkillsOutput 
} from './types';
import { randomUUID } from 'crypto';

export async function generateCharacterSkills(input: GenerateSkillsInput): Promise<GenerateSkillsOutput> {
  return generateSkillsFlow(input);
}


export const generateSkillsFlow = ai.defineFlow(
  {
    name: 'generateSkillsFlow',
    inputSchema: GenerateSkillsInputSchema,
    outputSchema: GenerateSkillsOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert tabletop RPG game designer. Your task is to generate a set of 3-4 thematic and balanced skills for a character based on their profile.

    Character Profile:
    - Archetype/Class: ${input.archetype}
    - Key Equipment: ${input.equipment.join(', ') || 'None'}
    - Biography Summary: ${input.biography.substring(0, 500)}...

    Instructions:
    1. Create 3 to 4 unique skills.
    2. Each skill must have a name, a description of what it does, a power level (1-10), and a type (attack, defense, utility).
    3. The skills should be creative and directly inspired by the character's archetype, equipment, and backstory. For example, a "Starship Captain" with a "laser pistol" might have a skill called "Ricochet Shot", not a generic "Fireball".
    4. Ensure a balanced mix of skill types (e.g., 2 attack, 1 defense, 1 utility).
    5. The power level should reflect the skill's impact in a game. A simple sword strike might be power 3, while a powerful area-of-effect spell could be power 8.
    6. The output must be ONLY the JSON object.
    `;

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: prompt,
      output: {
        schema: GenerateSkillsOutputSchema,
      },
    });
    
    if (!output) {
      throw new Error('AI failed to generate skills.');
    }
    
    // Add a unique ID to each generated skill
    const skillsWithIds = output.skills.map(skill => ({
      ...skill,
      id: randomUUID(),
    }));

    return { skills: skillsWithIds };
  }
);
