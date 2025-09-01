
/**
 * @fileoverview A script to fetch and process Danbooru tags.
 * This script connects to the Danbooru API, retrieves tags page by page,
 * filters and categorizes them based on predefined keywords, and saves
 * the result to a local JSON file (`data/danbooru-tags.json`).
 *
 * This allows the application to use a rich, pre-processed set of real-world
 * tags for AI suggestions without making live API calls during user sessions.
 *
 * To run: `npm run tags:fetch`
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// #region Configuration
// Define our custom categories and the keywords to identify them.
const CATEGORIES_CONFIG = {
    headwear: ['hat', 'cap', 'hood', 'helmet', 'tiara', 'beret', 'headband', 'hairpin'],
    topwear: ['shirt', 'blouse', 'jacket', 'hoodie', 'armor', 'pauldrons', 'corset', 'vest', 'sweater'],
    bottomwear: ['skirt', 'pants', 'jeans', 'shorts', 'leggings', 'greaves', 'trousers'],
};
type CustomCategory = keyof typeof CATEGORIES_CONFIG;

// Danbooru API settings
const API_BASE_URL = 'https://danbooru.donmai.us';
const TAGS_PER_PAGE = 1000;
const PAGE_LIMIT = 50; // Fetch 50 pages for a total of 50,000 tags to process
const MIN_POST_COUNT = 100; // Ignore tags with fewer than this many posts

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'danbooru-tags.json');
// #endregion

// #region Type Definitions
interface DanbooruTag {
    id: number;
    name: string;
    post_count: number;
    category: number; // 0: general, 1: artist, 3: copyright, 4: character, 5: meta
    created_at: string;
    updated_at: string;
    is_locked: boolean;
    is_deprecated: boolean;
}

interface ProcessedTag {
    name: string;
    post_count: number;
}

type CategorizedTags = Record<CustomCategory, ProcessedTag[]>;
// #endregion

/**
 * Fetches a single page of tags from the Danbooru API.
 * @param page The page number to fetch.
 * @returns A promise that resolves to an array of DanbooruTag objects.
 */
async function fetchTagPage(page: number): Promise<DanbooruTag[]> {
    const url = `${API_BASE_URL}/tags.json?page=${page}&limit=${TAGS_PER_PAGE}`;
    console.log(`- Fetching page ${page} from ${url}`);
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'CharaForge/1.0' } });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        return await response.json() as DanbooruTag[];
    } catch (error) {
        console.error(`  - Error fetching page ${page}:`, error);
        return []; // Return empty array on error to continue processing other pages
    }
}

/**
 * Main function to orchestrate the fetching, processing, and saving of tags.
 */
async function main() {
    console.log('🚀 Starting Danbooru tag fetching process...');
    console.log(`- Saving results to: ${OUTPUT_PATH}`);

    const categorizedTags: CategorizedTags = {
        headwear: [],
        topwear: [],
        bottomwear: [],
    };

    let totalProcessed = 0;

    for (let page = 1; page <= PAGE_LIMIT; page++) {
        const tags = await fetchTagPage(page);
        if (tags.length === 0) {
            console.log('- No more tags to fetch. Ending process.');
            break;
        }

        for (const tag of tags) {
            if (tag.post_count < MIN_POST_COUNT || tag.is_deprecated) {
                continue;
            }

            const tagName = tag.name;
            let assignedCategory: CustomCategory | null = null;

            for (const [category, keywords] of Object.entries(CATEGORIES_CONFIG)) {
                if (keywords.some(keyword => tagName.includes(keyword))) {
                    assignedCategory = category as CustomCategory;
                    break;
                }
            }

            if (assignedCategory) {
                categorizedTags[assignedCategory].push({
                    name: tagName,
                    post_count: tag.post_count,
                });
                totalProcessed++;
            }
        }
        // A small delay to be polite to the API
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n📊 Processing complete. Found and categorized ${totalProcessed} relevant tags.`);

    // Sort each category by post count (descending)
    for (const category of Object.keys(categorizedTags) as CustomCategory[]) {
        categorizedTags[category].sort((a, b) => b.post_count - a.post_count);
    }

    try {
        await fs.writeFile(OUTPUT_PATH, JSON.stringify(categorizedTags, null, 2));
        console.log(`✅ Successfully saved categorized tags to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error('❌ Failed to write the output file:', error);
    }
}

main().catch(error => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
});
