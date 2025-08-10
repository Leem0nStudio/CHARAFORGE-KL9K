
'use server';

/**
 * @fileOverview This flow acts as an AI agent for suggesting Danbooru tags.
 * It uses a dedicated search service, exposed as a Genkit Tool, to find
 * relevant tags based on a user's natural language query. This abstracts
 * the data source from the AI's reasoning process.
 *
 * - suggestDanbooruTags - The main function that orchestrates the tag suggestion.
 * - SuggestDanbooruTagsInput - The input type for the flow.
 * - SuggestDanbooruTagsOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    searchTags, 
    SearchTagsInputSchema, 
    SearchTagsOutputSchema 
} from '@/services/danbooru-tag-search';

// Define the Genkit Tool that wraps our search service.
// This makes the search functionality available to the AI model.
const searchTagsTool = ai.defineTool(
  {
    name: 'searchTagsTool',
    description: 'Searches a curated tag database for tags matching a query and optional category. Useful for finding specific, existing tags to build an image prompt.',
    inputSchema: SearchTagsInputSchema,
    outputSchema: SearchTagsOutputSchema,
  },
  async (input) => searchTags(input)
);


export const SuggestDanbooruTagsInputSchema = z.object({
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
  3. Use the 'searchTagsTool' to find relevant tags from the tag database. You might need to call the tool with a simplified version of the user's query to get good results.
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
