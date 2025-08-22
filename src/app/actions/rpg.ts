
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character, RpgAttributes } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const CharacterIdSchema = z.string().min(1, 'A character ID is required.');

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


async function getCharacterForRpg(characterId: string, uid: string): Promise<Character> {
    if (!adminDb) {
        throw new Error('Database service is unavailable.');
    }
    const charRef = adminDb.collection('characters').doc(characterId);
    const charDoc = await charRef.get();

    if (!charDoc.exists) {
        throw new Error('Character not found.');
    }
    const characterData = charDoc.data();
    if (characterData?.meta.userId !== uid) {
        throw new Error('Permission denied.');
    }
    if (!characterData?.core.archetype) {
        throw new Error('Character must have an Archetype (class) assigned to generate attributes.');
    }
    // This is a re-casting, but it's safe because we've checked the required fields.
    return characterData as Character;
}


/**
 * A single, robust server action to generate all RPG attributes (stats and skills).
 * This function handles the entire lifecycle of the generation process.
 * @param characterId The ID of the character to generate attributes for.
 * @returns A promise that resolves to an ActionResponse.
 */
export async function generateAllRpgAttributes(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const validation = CharacterIdSchema.safeParse(characterId);
    if (!validation.success) {
        return { success: false, message: 'Invalid character ID.' };
    }

    const charRef = adminDb.collection('characters').doc(characterId);

    try {
        // Step 1: Set status to pending to update the UI immediately
        await charRef.update({ 
            'rpg.statsStatus': 'pending',
            'rpg.skillsStatus': 'pending',
        });
        revalidatePath(`/characters/${characterId}/edit`);

        // Step 2: Get character data
        const character = await getCharacterForRpg(characterId, uid);

        // Step 3: Generate stats and skills in parallel
        const [stats, skillsResult] = await Promise.all([
            generateBalancedStats(character.core.archetype!),
            generateSkillsFlow({
                archetype: character.core.archetype!,
                equipment: character.core.equipment || [],
                biography: character.core.biography,
            })
        ]);
        
        const newRarity = calculateRarity(stats);

        // Step 4: Update Firestore with the final results
        await charRef.update({
            'rpg.stats': stats,
            'core.rarity': newRarity,
            'rpg.skills': skillsResult.skills,
            'rpg.statsStatus': 'complete',
            'rpg.skillsStatus': 'complete',
        });
        
        revalidatePath(`/characters/${characterId}/edit`);
        return { success: true, message: 'Character attributes generated successfully!' };

    } catch (error) {
        await charRef.update({ 
            'rpg.statsStatus': 'failed',
            'rpg.skillsStatus': 'failed',
        }).catch(() => {});
        revalidatePath(`/characters/${characterId}/edit`);
        const message = error instanceof Error ? error.message : 'An unknown error occurred during attribute generation.';
        return { success: false, message, error: message };
    }
}
