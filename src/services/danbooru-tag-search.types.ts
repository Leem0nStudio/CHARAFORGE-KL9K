import { z } from 'zod';

export const SearchTagsInputSchema = z.object({
  query: z.string().describe("A simple, one or two-word search term (e.g., 'hat', 'skirt', 'armor')."),
  category: z.enum(['headwear', 'topwear', 'bottomwear', 'general']).optional().describe("The category to search within. If 'general', search all categories."),
});
export type SearchTagsInput = z.infer<typeof SearchTagsInputSchema>;

export const SearchTagsOutputSchema = z.array(z.string()).describe("A list of matching tag names.");
export type SearchTagsOutput = z.infer<typeof SearchTagsOutputSchema>;
