

/**
 * @fileoverview This Cloud Function is now DEPRECATED.
 * The logic for RPG attribute generation is now called directly from the 
 * `rollForCharacterStats` server action. The background task queue is no longer needed
 * for this operation in the new architecture.
 */

import { logger } from 'firebase-functions/v2';

export const triggerRpgGeneration = () => {
    logger.warn("triggerRpgGeneration Cloud Function is deprecated and should not be deployed.");
    return null;
};
