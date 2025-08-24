
/**
 * @fileoverview This Cloud Function is triggered by a Pub/Sub message from a task queue.
 * Its purpose is to call the `generateAndSaveSkills` server action, ensuring that
 * AI-powered skill generation happens reliably in the background.
 */

import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { logger } from 'firebase-functions/v2';
import { generateAndSaveSkills } from '../app/actions/rpg'; 
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already done. This is crucial for the function environment.
if (getApps().length === 0) {
  initializeApp();
}

export const triggerRpgGeneration = onTaskDispatched(async (request) => {
    // The data now includes archetype and biography directly from the calling function.
    const { characterId, archetype, biography } = request.data as { characterId?: string, archetype?: string, biography?: string };

    if (!characterId || !archetype || !biography) {
        logger.error("Task queue message is missing required data ('characterId', 'archetype', or 'biography').", { data: request.data });
        return;
    }

    logger.info(`Received task to generate RPG attributes for character: ${characterId}`);
    
    try {
        // Pass the received data directly to the generation action.
        const result = await generateAndSaveSkills(characterId, archetype, biography);
        if (result.success) {
            logger.info(`Successfully processed RPG attributes for character ${characterId}. Message: ${result.message}`);
        } else {
            logger.error(`Failed to process RPG attributes for character ${characterId}. Reason: ${result.message}`);
        }
    } catch (error: any) {
        logger.error(`An unexpected error occurred while triggering RPG generation for ${characterId}.`, {
            errorMessage: error.message,
            stack: error.stack,
        });
    }
});
