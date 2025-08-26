/**
 * @fileOverview Data schemas and types for the character image generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import {z} from 'genkit';
import type { ImageEngineConfig } from '@/types/generation';

// This is now just a re-export for the server-side flow.
// The client will import directly from '@/types/generation'.
export type { ImageEngineConfig };


// The input to the main flow is now much simpler.
export const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The positive description of the character.'),
  negativePrompt: z.string().optional().describe('A description of elements to avoid in the image.'),
  engineConfig: z.custom<ImageEngineConfig>().describe('The complete configuration for the image generation engine.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;


export const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;
