

/**
 * @fileoverview This Cloud Function is now DEPRECATED.
 * The logic for image processing has been moved directly into the `reprocessCharacterImage`
 * server action in `src/app/actions/character-image.ts`. This makes the process
 * compatible with a Vercel deployment environment.
 */

import { logger } from 'firebase-functions/v2';

export const processUploadedImage = () => {
    logger.warn("processUploadedImage Cloud Function is deprecated and should not be deployed.");
    return null;
};
