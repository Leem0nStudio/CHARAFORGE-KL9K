
/**
 * @fileOverview Data schemas and types for the text-to-speech (TTS) flow.
 */

import { z } from 'zod';

export const GenerateSpeechInputSchema = z.object({
  textToNarrate: z.string().describe("The text content to be converted into audible speech."),
});
export type GenerateSpeechInput = z.infer<typeof GenerateSpeechInputSchema>;


export const GenerateSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe('The generated audio as a data URI, including MIME type (audio/wav) and Base64 encoding.'),
});
export type GenerateSpeechOutput = z.infer<typeof GenerateSpeechOutputSchema>;
