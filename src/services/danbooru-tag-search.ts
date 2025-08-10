
'use server';
/**
 * @fileOverview A simulated service for searching Danbooru tags.
 * In a real-world application, this service would read from a pre-processed
 * JSON file or a dedicated search database (like Algolia or a specialized Firestore collection)
 * that is populated from the Danbooru tag dump.
 *
 * HOW THE REAL SYSTEM WORKS:
 * 1.  OFFLINE PROCESS: A developer downloads the large tag dump from Danbooru.
 * 2.  PRE-PROCESSING: A separate script processes this massive file, filtering and categorizing
 *     tags into a more manageable structure (e.g., custom categories like 'headwear').
 * 3.  DATA STORAGE: The processed, smaller JSON file(s) are uploaded to a place like
 *     Firebase Storage, or the data is inserted into a Firestore collection.
 * 4.  THIS SERVICE: This server-side code would then fetch and search that optimized
 *     data from Storage/Firestore, not the raw dump.
 *
 * For demonstration purposes, we are using a small, hardcoded sample below.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// #region Simulated Tag Database
// This is a small, curated sample of what would be a very large, pre-processed file.
// In production, this data would be fetched from Firestore or a JSON file in Storage.
const TAG_DATABASE = {
    headwear: [
        { name: "witch_hat", post_count: 10000 },
        { name: "pirate_hat", post_count: 5000 },
        { name: "baseball_cap", post_count: 20000 },
        { name: "beret", post_count: 8000 },
        { name: "top_hat", post_count: 7000 },
        { name: "fedora", post_count: 4000 },
        { name: "helmet", post_count: 30000 },
        { name: "tiara", post_count: 15000 },
    ],
    topwear: [
        { name: "t-shirt", post_count: 150000 },
        { name: "dress_shirt", post_count: 40000 },
        { name: "jacket", post_count: 120000 },
        { name: "hoodie", post_count: 80000 },
        { name: "armor", post_count: 90000 },
        { name: "pauldrons", post_count: 10000 },
        { name: "spiked_pauldrons", post_count: 2000 },
        { name: "corset", post_count: 25000 },
    ],
    bottomwear: [
        { name: "jeans", post_count: 100000 },
        { name: "skirt", post_count: 200000 },
        { name: "pleated_skirt", post_count: 80000 },
        { name: "leggings", post_count: 50000 },
        { name: "armored_greaves", post_count: 5000 },
        { name: "cargo_shorts", post_count: 15000 },
    ],
};

type TagCategory = keyof typeof TAG_DATABASE;
// #endregion

// #region Tag Search Service
export const SearchTagsInputSchema = z.object({
  query: z.string().describe("A simple, one or two-word search term (e.g., 'hat', 'skirt', 'armor')."),
  category: z.enum(['headwear', 'topwear', 'bottomwear', 'general']).optional().describe("The category to search within. If 'general', search all categories."),
});
export type SearchTagsInput = z.infer<typeof SearchTagsInputSchema>;

export const SearchTagsOutputSchema = z.array(z.string()).describe("A list of matching tag names.");
export type SearchTagsOutput = z.infer<typeof SearchTagsOutputSchema>;


/**
 * A simulated search function that mimics searching through a pre-processed tag database.
 * @param input - The search parameters, including the query and optional category.
 * @returns A promise that resolves to a list of matching tag names, sorted by popularity.
 */
export async function searchTags(input: SearchTagsInput): Promise<SearchTagsOutput> {
    const { query, category } = input;
    const searchTerm = query.toLowerCase().replace(/s$/, ''); // Basic pluralization removal

    let tagsToSearch: { name: string, post_count: number }[] = [];

    if (category && category !== 'general') {
        tagsToSearch = TAG_DATABASE[category] || [];
    } else {
        // If general or no category, search all
        tagsToSearch = Object.values(TAG_DATABASE).flat();
    }

    const results = tagsToSearch
        .filter(tag => tag.name.includes(searchTerm))
        .sort((a, b) => b.post_count - a.post_count) // Sort by popularity
        .map(tag => tag.name);

    return results.slice(0, 10); // Return top 10 matches
}
// #endregion
