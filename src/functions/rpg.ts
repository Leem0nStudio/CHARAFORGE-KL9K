/**
 * @fileoverview Cloud Function to handle RPG attribute generation via a Task Queue.
 * This function is triggered by a task enqueued by the `generateAllRpgAttributes`
 * server action. It reliably executes the Genkit flow in the background.
 */

import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { generateAllRpgAttributesFlow } from '@/ai/flows/rpg-attributes/flow';
import type { Character } from '@/types/character';

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * A Task Queue function that handles the generation of both stats and skills.
 * This is triggered by a task and is the reliable entry point for the background job.
 */
export const triggerRpgGeneration = onTaskDispatched({
    retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 10,
    },
    rateLimits: {
        maxDispatchesPerSecond: 2,
    },
    timeoutSeconds: 300, // Extend timeout for Genkit execution
    cpu: 2, // Allocate more CPU for AI processing
}, async (req) => {
    const { characterId } = req.data as { characterId: string };
    if (!characterId) {
        logger.error("Task Queue Error: characterId was not provided.", req.data);
        return;
    }
    
    logger.log(`Starting RPG generation task for character: ${characterId}`);
    const charRef = db.collection('characters').doc(characterId);

    try {
        const charDoc = await charRef.get();
        if (!charDoc.exists) {
            throw new Error(`Character ${characterId} not found in database.`);
        }
        const character = charDoc.data() as Character;

        // Call the unified Genkit flow
        const attributes = await generateAllRpgAttributesFlow(character);

        // Update Firestore with the results
        await charRef.update({
            'rpg.stats': attributes.stats,
            'core.rarity': attributes.rarity,
            'rpg.skills': attributes.skills,
            'rpg.statsStatus': 'complete',
            'rpg.skillsStatus': 'complete',
        });

        logger.log(`Successfully generated and saved RPG attributes for character ${characterId}.`);

    } catch (error) {
        logger.error(`Failed to generate RPG attributes for character ${characterId}.`, { error });
        await charRef.update({ 
            'rpg.statsStatus': 'failed',
            'rpg.skillsStatus': 'failed' 
        });
    }
});

    