

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character, RpgAttributes } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const CharacterIdSchema = z.string().min(1, 'A character ID is required.');

// #region "Intelligent Dice Roll" Stat Generation Logic (from previous step)

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
        
        const stats = generateBalancedStats(character.core.archetype!);
        const newRarity = calculateRarity(stats);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        await charRef.update({
            'rpg.stats': stats,
            'core.rarity': newRarity,
            'rpg.statsStatus': 'complete',
        });
        
        revalidatePath(`/characters/${characterId}/edit`);
        return { success: true, message: 'Stats generated successfully!' };
    } catch (error) {
        await charRef.update({ 'rpg.statsStatus': 'failed' }).catch(() => {});
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
        await charRef.update({ 'rpg.skillsStatus': 'failed' }).catch(() => {});
        revalidatePath(`/characters/${characterId}/edit`);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message, error: message };
    }
}
