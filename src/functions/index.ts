
/**
 * @fileoverview Main entry point for Firebase Cloud Functions.
 * This file should only import and export the functions to be deployed.
 */

// Import and export the image processing function.
export { processUploadedImage } from './image-processing';


// NOTE: Genkit flows are automatically handled by the Genkit plugin
// and do not need to be exported from here.

// The RPG generation function is no longer a task queue handler.
// It has been moved to a direct Server Action.
// export { triggerRpgGeneration } from './rpg';
