
'use server';

/**
 * @fileOverview An AI agent for suggesting Danbooru tags based on a user query.
 *
 * - suggestDanbooruTags - A function that handles the tag suggestion process.
 * - SuggestDanbooruTagsInput - The input type for the function.
 * - SuggestDanbooruTagsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchTagsTool } from '@/services/danbooru-tags';

const SuggestDanbooruTagsInputSchema = z.object({
  query: z.string().describe('The user\'s search query for tags (e.g., "a cool hat", "spiky armor").'),
  category: z.enum(['headwear', 'topwear', 'bottomwear', 'general']).optional().describe('An optional category to narrow down the search.'),
});
export type SuggestDanbooruTagsInput = z.infer<typeof SuggestDanbooruTagsInputSchema>;

const SuggestDanbooruTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('A list of 3-5 relevant Danbooru tags based on the user\'s query.'),
});
export type SuggestDanbooruTagsOutput = z.infer<typeof SuggestDanbooruTagsOutputSchema>;

export async function suggestDanbooruTags(
  input: SuggestDanbooruTagsInput
): Promise<SuggestDanbooruTagsOutput> {
  return suggestDanbooruTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDanbooruTagsPrompt',
  input: { schema: SuggestDanbooruTagsInputSchema },
  output: { schema: SuggestDanbooruTagsOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [searchTagsTool],
  prompt: `You are an expert at mapping user descriptions to precise Danbooru tags. Your goal is to help a user build a high-quality prompt for an image generation AI.

  Instructions:
  1. Analyze the user's query: {{{query}}}.
  2. If a category is provided ({{#if category}}Category: {{{category}}}{{/if}}), use it to narrow your focus.
  3. Use the 'searchTagsTool' to find relevant tags from the Danbooru tag database. You might need to call the tool with a simplified version of the user's query to get good results.
  4. From the search results, select the 3-5 most relevant and specific tags that match the user's intent.
  5. Return these tags in the 'suggestedTags' array. Do not suggest tags that were not returned by the tool.
  `,
});

const suggestDanbooruTagsFlow = ai.defineFlow(
  {
    name: 'suggestDanbooruTagsFlow',
    inputSchema: SuggestDanbooruTagsInputSchema,
    outputSchema: SuggestDanbooruTagsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to suggest any tags.');
    }
    return output;
  }
);
