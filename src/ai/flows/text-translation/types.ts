/**
 * @fileOverview Data schemas and types for the text translation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import {z} from 'genkit';
import { TextEngineConfigSchema } from '@/ai/utils/llm-utils';

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.enum(['Spanish', 'French', 'German']).describe('The target language for translation.'),
  engineConfig: TextEngineConfigSchema.describe('The configuration for the text generation engine.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The resulting translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;
