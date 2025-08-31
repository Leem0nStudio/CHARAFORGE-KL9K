
/**
 * @fileoverview Main entry point for Firebase Cloud Functions.
 * This file should only import and export the functions to be deployed.
 */

// Import and export the image processing function.
export { processUploadedImage } from './image-processing';

// Import and export the RPG generation trigger function.
export { triggerRpgGeneration } from './rpg';

// Import and export the model sync worker function.
export { syncModelWorker } from './sync-model';


// NOTE: Genkit flows are automatically handled by the Genkit plugin
// and do not need to be exported from here.
