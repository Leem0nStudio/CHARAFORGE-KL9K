/**
 * @fileoverview HTTP-callable functions for RPG attribute generation.
 * These functions are designed to be called by other server-side processes
 * (like the image processing function) to trigger Genkit flows.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateStatsFlow } from '@/ai/flows/rpg-stats/flow';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character } from '@/types/character';

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Generates and saves RPG stats for a given character.
 */
export const generateCharacterStats = onCall(async (request) => {
    const { characterId } = request.data;
    if (!characterId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "characterId".');
    }

    const charRef = db.collection('characters').doc(characterId);
    const charDoc = await charRef.get();

    if (!charDoc.exists) {
        throw new HttpsError('not-found', `Character with ID ${characterId} not found.`);
    }

    const character = charDoc.data() as Character;
    
    try {
        const stats = await generateStatsFlow({
            archetype: character.core.archetype || 'Adventurer',
            rarity: character.core.rarity || 3,
        });

        await charRef.update({
            'rpg.stats': stats,
            'rpg.statsStatus': 'complete',
        });
        
        return { success: true, message: `Stats generated for ${character.core.name}.`};

    } catch (error) {
        await charRef.update({ 'rpg.statsStatus': 'failed' });
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new HttpsError('internal', `Failed to generate stats: ${message}`);
    }
});


/**
 * Generates and saves RPG skills for a given character.
 */
export const generateCharacterSkills = onCall(async (request) => {
    const { characterId } = request.data;
    if (!characterId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "characterId".');
    }

    const charRef = db.collection('characters').doc(characterId);
    const charDoc = await charRef.get();

    if (!charDoc.exists) {
        throw new HttpsError('not-found', `Character with ID ${characterId} not found.`);
    }

    const character = charDoc.data() as Character;
    
    try {
        const { skills } = await generateSkillsFlow({
            archetype: character.core.archetype || 'Adventurer',
            equipment: character.core.equipment || [],
            biography: character.core.biography,
        });

        await charRef.update({
            'rpg.skills': skills,
        });
        
        return { success: true, message: `Skills generated for ${character.core.name}.`};

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new HttpsError('internal', `Failed to generate skills: ${message}`);
    }
});

