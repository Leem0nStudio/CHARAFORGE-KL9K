/**
 * @fileOverview Data schemas and types for the Danbooru tag suggestion flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import { z } from 'zod';

export const SuggestDanbooruTagsInputSchema = z.object({
  description: z.string().describe("The user's full character description to be analyzed for tag suggestions."),
});
export type SuggestDanbooruTagsInput = z.infer<typeof SuggestDanbooruTagsInputSchema>;

export const SuggestDanbooruTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of 5-7 relevant Danbooru tags based on the user\'s description.'),
});
export type SuggestDanbooruTagsOutput = z.infer<typeof SuggestDanbooruTagsOutputSchema>;
