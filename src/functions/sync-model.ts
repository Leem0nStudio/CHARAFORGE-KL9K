

/**
 * @fileoverview This Cloud Function is now DEPRECATED.
 * The logic for syncing AI models from external sources has been moved into the
 * `enqueueModelSyncJob` server action in `src/app/actions/tasks.ts`.
 */

import { logger } from 'firebase-functions/v2';

export const syncModelWorker = () => {
    logger.warn("syncModelWorker Cloud Function is deprecated and should not be deployed.");
    return null;
};
