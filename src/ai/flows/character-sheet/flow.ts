
'use server';

/**
 * @fileOverview Character sheet generation AI agent.
 * This flow generates a structured character sheet from a simple description,
 * including RPG stats and rarity calculated based on the generated archetype.
 */
import { ai } from '@/ai/genkit';
import { 
  GenerateCharacterSheetInputSchema, 
  GenerateCharacterSheetOutputSchema, 
  type GenerateCharacterSheetInput, 
  type GenerateCharacterSheetOutput 
} from './types';
import type { RpgAttributes, Character } from '@/types/character';

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

function generateStats(archetype: string): RpgAttributes['stats'] {
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
    
    // This prompt now asks the AI to determine the archetype from the description.
    const prompt = `You are a professional writer and game master specializing in creating rich character details. Your task is to generate a complete character sheet from a user's description.

    Based on the provided description, generate all the required fields.
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}. All other fields should also be translated.` : 'All fields MUST be written in English.'}

    Description: """
    ${description}
    """
    
    Instructions for each field:
    - name: A fitting and creative name for the character.
    - archetype: Based on the description, determine the character's class, role, or archetype (e.g., "Grizzled Detective", "Cyber-Sorcerer", "Starship Captain", "Warrior", "Mage"). This is a critical field.
    - equipment: A list of 3-5 key items, weapons, or gear the character possesses.
    - physicalDescription: A detailed, one-paragraph description focusing only on the character's visual appearance, clothing, and gear. This will be used for an image generation prompt, so be descriptive and evocative.
    - biography: A detailed, multi-paragraph biography exploring the character's backstory, personality, and motivations. Make it engaging and narrative-driven.
    `;

    // This schema is for the AI output, which does NOT include stats/rarity yet.
    const AiOutputSchema = GenerateCharacterSheetOutputSchema.omit({ stats: true, rarity: true });

    let aiOutput: z.infer<typeof AiOutputSchema>;

    if (engineId === 'openrouter') {
        const systemApiKey = process.env.OPENROUTER_API_KEY;
        const apiKey = userApiKey || systemApiKey;

        if (!apiKey) {
            throw new Error("OpenRouter API key is not configured on the server or provided by the user in their profile settings.");
        }
        
        const { output } = await ai.generate({
            model: modelId,
            prompt: prompt,
            output: {
                schema: AiOutputSchema,
                format: 'json',
            },
            config: {
                apiKey: apiKey,
                provider: 'openai',
                 extraHeaders: {
                    'HTTP-Referer': 'https://charaforge.com',
                    'X-Title': 'CharaForge',
                },
            },
        });
        
         if (!output) {
            throw new Error('AI failed to generate a character sheet via OpenRouter.');
        }
        aiOutput = output;

    } else {
        // Default to Gemini engine
        const finalModelId = 'googleai/gemini-1.5-flash-latest';
        const { output } = await ai.generate({
            model: finalModelId,
            prompt: prompt,
            output: {
                schema: AiOutputSchema,
            },
        });
        if (!output) {
          throw new Error('AI failed to generate a character sheet.');
        }
        aiOutput = output;
    }
    
    // Now that the AI has determined the archetype, generate stats and rarity.
    const archetype = aiOutput.archetype || 'Fighter'; // Default to Fighter if archetype is missing
    const stats = generateStats(archetype);
    const rarity = calculateRarity(stats);
    
    // Return the combined result, fulfilling the full output schema.
    return {
      ...aiOutput,
      stats,
      rarity,
    };
  }
);
