/**
 * @fileoverview HTTP-callable functions for RPG attribute generation.
 * These functions are designed to be called by other server-side processes
 * (like the image processing function) to trigger Genkit flows.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { generateStatsFlow } from '@/ai/flows/rpg-stats/flow';
import { generateSkillsFlow } from '@/ai/flows/rpg-skills/flow';
import type { Character } from '@/types/character';

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * A Task Queue function that handles the generation of both stats and skills.
 * This is more efficient as it's triggered once per character processing.
 */
export const triggerRpgGeneration = onTaskDispatched(async (req) => {
    const { characterId } = req.data as { characterId: string };
    if (!characterId) {
        logger.error("Task Queue Error: characterId was not provided.", req.data);
        return;
    }
    
    logger.log(`Starting RPG generation for character: ${characterId}`);
    const charRef = db.collection('characters').doc(characterId);

    try {
        const charDoc = await charRef.get();
        if (!charDoc.exists) {
            logger.error(`Character ${characterId} not found.`);
            return;
        }
        const character = charDoc.data() as Character;
        if (!character.core.archetype) {
            logger.warn(`Character ${characterId} has no archetype. Skipping RPG generation.`);
            await charRef.update({ 'rpg.statsStatus': 'failed', 'rpg.skillsStatus': 'failed' });
            return;
        }

        // Generate stats and skills in parallel
        const [stats, { skills }] = await Promise.all([
            generateStatsFlow({
                archetype: character.core.archetype,
                rarity: character.core.rarity || 3,
            }),
            generateSkillsFlow({
                archetype: character.core.archetype,
                equipment: character.core.equipment || [],
                biography: character.core.biography,
            })
        ]);

        // Update Firestore with both results
        await charRef.update({
            'rpg.stats': stats,
            'rpg.statsStatus': 'complete',
            'rpg.skills': skills,
            'rpg.skillsStatus': 'complete',
        });

        logger.log(`Successfully generated stats and skills for ${characterId}.`);

    } catch (error) {
        logger.error(`Failed to generate RPG attributes for ${characterId}.`, { error });
        await charRef.update({ 'rpg.statsStatus': 'failed', 'rpg.skillsStatus': 'failed' });
    }
});
