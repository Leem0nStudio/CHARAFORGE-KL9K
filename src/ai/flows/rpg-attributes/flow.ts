
'use server';

/**
 * @fileOverview An AI agent for generating a character's complete RPG attributes.
 * This is designed to be a self-contained, asynchronous flow.
 */
import { ai } from '@/ai/genkit';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { Character, RpgAttributes } from '@/types/character';
import { 
  GenerateAllRpgAttributesInputSchema,
  GenerateAllRpgAttributesOutputSchema,
  type GenerateAllRpgAttributesInput, 
  type GenerateAllRpgAttributesOutput,
  SkillSchema,
} from './types';


// #region "Intelligent Dice Roll" Stat Generation Logic
type Stat = keyof RpgAttributes['stats'];
const STAT_KEYS: Stat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const archetypeStatPriorities: Record<string, [Stat, Stat] | [Stat]> = {
    Artificer: ['intelligence', 'constitution'],
    Barbarian: ['strength', 'constitution'],
    Bard: ['charisma', 'dexterity'],
    Cleric: ['wisdom', 'constitution'],
    Druid: ['wisdom', 'constitution'],
    Fighter: ['strength', 'dexterity'],
    Monk: ['dexterity', 'wisdom'],
    Paladin: ['strength', 'charisma'],
    Ranger: ['dexterity', 'wisdom'],
    Rogue: ['dexterity', 'charisma'],
    Sorcerer: ['charisma', 'constitution'],
    Warlock: ['charisma', 'constitution'],
    Wizard: ['intelligence', 'constitution'],
};

function roll4d6DropLowest(): number {
    const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift();
    return rolls.reduce((sum, roll) => sum + roll, 0);
}

function generateBalancedStats(archetype: string): RpgAttributes['stats'] {
    const statPool = Array(6).fill(0).map(() => roll4d6DropLowest());
    statPool.sort((a, b) => b - a);

    const priorities = archetypeStatPriorities[archetype as keyof typeof archetypeStatPriorities] || [];
    const remainingStats = STAT_KEYS.filter(stat => !priorities.includes(stat));

    const finalStats: Partial<RpgAttributes['stats']> = {};

    priorities.forEach((priorityStat) => {
        finalStats[priorityStat] = statPool.shift();
    });

    remainingStats.forEach(stat => {
        finalStats[stat] = statPool.shift();
    });

    return finalStats as RpgAttributes['stats'];
}

function calculateRarity(stats: RpgAttributes['stats']): Character['core']['rarity'] {
    const totalScore = Object.values(stats).reduce((sum, value) => sum + value, 0);
    if (totalScore >= 90) return 5;
    if (totalScore >= 80) return 4;
    if (totalScore >= 65) return 3;
    if (totalScore >= 50) return 2;
    return 1;
}

// #endregion


const skillsGenerationPrompt = ai.definePrompt(
  {
    name: 'generateSkillsPrompt',
    input: {
        schema: z.object({
            archetype: z.string(),
            equipment: z.array(z.string()),
            biography: z.string(),
        })
    },
    output: {
      schema: z.object({
        skills: z.array(SkillSchema.omit({ id: true })) // AI doesn't need to generate the ID
      }),
    },
  },
  async (input) => {
    return `You are an expert tabletop RPG game designer. Your task is to generate a set of 3-4 thematic and balanced skills for a character based on their profile.

    Character Profile:
    - Archetype/Class: ${input.archetype}
    - Key Equipment: ${input.equipment.join(', ') || 'None'}
    - Biography Summary: ${input.biography.substring(0, 500)}...

    Instructions:
    1. Create 3 to 4 unique skills.
    2. Each skill must have a name, a description of what it does, a power level (1-10), and a type (attack, defense, utility).
    3. The skills should be creative and directly inspired by the character's archetype, equipment, and backstory. For ejemplo, a "Starship Captain" with a "laser pistol" might have a skill called "Ricochet Shot", not a generic "Fireball".
    4. Ensure a balanced mix of skill types (e.g., 2 attack, 1 defense, 1 utility).
    5. The power level should reflect the skill's impact in a game. A simple sword strike might be power 3, while a powerful area-of-effect spell could be power 8.
    6. The output must be ONLY the JSON object.
    `;
  }
);


export const generateAllRpgAttributesFlow = ai.defineFlow(
  {
    name: 'generateAllRpgAttributesFlow',
    inputSchema: GenerateAllRpgAttributesInputSchema,
    outputSchema: GenerateAllRpgAttributesOutputSchema,
  },
  async (character) => {
    
    // Step 1: Generate stats using the deterministic "dice roll" method.
    const stats = generateBalancedStats(character.core.archetype!);
    
    // Step 2: Calculate rarity based on the generated stats.
    const rarity = calculateRarity(stats);

    // Step 3: Generate skills using an AI call.
    const skillsResponse = await skillsGenerationPrompt({
        archetype: character.core.archetype!,
        equipment: character.core.equipment || [],
        biography: character.core.biography,
    });
    
    if (!skillsResponse.output) {
      throw new Error('AI failed to generate skills.');
    }
    
    // Add unique IDs to the skills generated by the AI.
    const skillsWithIds = skillsResponse.output.skills.map(skill => ({
      ...skill,
      id: randomUUID(),
    }));

    // Step 4: Return the complete, combined RPG attributes.
    return {
      stats,
      rarity,
      skills: skillsWithIds,
    };
  }
);
