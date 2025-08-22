
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character } from '@/types/character';
import type { RpgAttributes } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const CharacterIdSchema = z.string().min(1, 'A character ID is required.');

// #region New "Intelligent Dice Roll" Stat Generation Logic

type Stat = keyof RpgAttributes['stats'];
const STAT_KEYS: Stat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

// Define stat priorities for each archetype
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

/**
 * Simulates rolling 4 6-sided dice and dropping the lowest result.
 * @returns A number between 3 and 18.
 */
function roll4d6DropLowest(): number {
    const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b); // Sort ascending
    rolls.shift(); // Drop the lowest
    return rolls.reduce((sum, roll) => sum + roll, 0);
}

/**
 * Generates balanced RPG stats based on archetype and rarity using a dice roll simulation.
 * @param archetype The character's class.
 * @param rarity The character's rarity (1-5).
 * @returns An object containing the six ability scores.
 */
function generateBalancedStats(archetype: string, rarity: number): RpgAttributes['stats'] {
    // 1. Generate a pool of 6 stat values
    const statPool = Array(6).fill(0).map(() => roll4d6DropLowest());
    statPool.sort((a, b) => b - a); // Sort descending

    // 2. Get stat priorities for the archetype
    const priorities = archetypeStatPriorities[archetype] || [];
    const remainingStats = STAT_KEYS.filter(stat => !priorities.includes(stat));

    const finalStats: Partial<RpgAttributes['stats']> = {};

    // 3. Assign highest rolls to priority stats
    priorities.forEach((priorityStat, index) => {
        finalStats[priorityStat] = statPool.shift();
    });

    // 4. Assign remaining rolls to other stats
    remainingStats.forEach(stat => {
        finalStats[stat] = statPool.shift();
    });
    
    // 5. Apply rarity modifier
    const rarityModifier = rarity - 3; // -2 for rarity 1, 0 for rarity 3, +2 for rarity 5
    STAT_KEYS.forEach(stat => {
        (finalStats[stat] as number) += rarityModifier;
        // Ensure stats stay within a reasonable range (e.g., 1-20)
        (finalStats[stat] as number) = Math.max(1, Math.min(20, finalStats[stat] as number));
    });

    return finalStats as RpgAttributes['stats'];
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
    const character = charDoc.data() as Character;
    if (character.meta.userId !== uid) {
        throw new Error('Permission denied.');
    }
    if (!character.core.archetype) {
        throw new Error('Character must have an Archetype (class) assigned to generate attributes.');
    }
    return character;
}

export async function triggerStatGeneration(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const validation = CharacterIdSchema.safeParse(characterId);
    if (!validation.success) {
        return { success: false, message: 'Invalid character ID.' };
    }
    const charRef = adminDb.collection('characters').doc(characterId);

    try {
        await charRef.update({ 'rpg.statsStatus': 'pending' });
        revalidatePath(`/characters/${characterId}/edit`);

        const character = await getCharacterForRpg(characterId, uid);
        
        // **REPLACED AI FLOW WITH NEW LOGIC**
        const stats = generateBalancedStats(
            character.core.archetype!,
            character.core.rarity || 3,
        );
        
        // Add a small artificial delay to give the UI time to show the "pending" state.
        await new Promise(resolve => setTimeout(resolve, 1000));

        await charRef.update({
            'rpg.stats': stats,
            'rpg.statsStatus': 'complete',
        });
        
        revalidatePath(`/characters/${characterId}/edit`);
        return { success: true, message: 'Stats generated successfully!' };
    } catch (error) {
        await charRef.update({ 'rpg.statsStatus': 'failed' });
        revalidatePath(`/characters/${characterId}/edit`);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message, error: message };
    }
}


export async function triggerSkillGeneration(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const validation = CharacterIdSchema.safeParse(characterId);
    if (!validation.success) {
        return { success: false, message: 'Invalid character ID.' };
    }
    const charRef = adminDb.collection('characters').doc(characterId);

    try {
        await charRef.update({ 'rpg.skillsStatus': 'pending' });
        revalidatePath(`/characters/${characterId}/edit`);
        
        const character = await getCharacterForRpg(characterId, uid);
        
        // The skills generation still benefits from the creativity of an LLM.
        const { skills } = await generateSkillsFlow({
            archetype: character.core.archetype!,
            equipment: character.core.equipment || [],
            biography: character.core.biography,
        });

        await charRef.update({
            'rpg.skills': skills,
            'rpg.skillsStatus': 'complete',
        });
        
        revalidatePath(`/characters/${characterId}/edit`);
        return { success: true, message: 'Skills generated successfully!' };
    } catch (error) {
        await charRef.update({ 'rpg.skillsStatus': 'failed' });
        revalidatePath(`/characters/${characterId}/edit`);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message, error: message };
    }
}
