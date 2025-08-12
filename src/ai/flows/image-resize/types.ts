/**
 * @fileOverview Data schemas and types for the image resize flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import {z} from 'genkit';

export const ResizeImageInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The original image as a data URI, which must include a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ResizeImageInput = z.infer<typeof ResizeImageInputSchema>;

export const ResizeImageOutputSchema = z.object({
  resizedImageUrl: z
    .string()
    .describe('The resized 512x512 image as a data URI.'),
});
export type ResizeImageOutput = z.infer<typeof ResizeImageOutputSchema>;
