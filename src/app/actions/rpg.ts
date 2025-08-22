
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAndGetUid } from '@/lib/auth/server';
import { generateStatsFlow } from '@/ai/flows/rpg-stats/flow';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const CharacterIdSchema = z.string().min(1, 'A character ID is required.');

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
        
        const stats = await generateStatsFlow({
            archetype: character.core.archetype!,
            rarity: character.core.rarity || 3,
        });

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
