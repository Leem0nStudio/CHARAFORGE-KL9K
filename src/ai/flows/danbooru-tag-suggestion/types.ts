
import { z } from 'zod';

export const SuggestDanbooruTagsInputSchema = z.object({
  query: z.string().describe('The user\'s search query for tags (e.g., "a cool hat", "spiky armor").'),
  category: z.enum(['headwear', 'topwear', 'bottomwear', 'general']).optional().describe('An optional category to narrow down the search.'),
});
export type SuggestDanbooruTagsInput = z.infer<typeof SuggestDanbooruTagsInputSchema>;

export const SuggestDanbooruTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of 3-5 relevant Danbooru tags based on the user\'s query.'),
});
export type SuggestDanbooruTagsOutput = z.infer<typeof SuggestDanbooruTagsOutputSchema>;
