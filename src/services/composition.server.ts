
'use server';

/**
 * @fileoverview This service contains functions for the composition engine
 * that require server-only dependencies like the Supabase client.
 * This file should only be imported by other server components or actions.
 */

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { DataPack } from '@/types/datapack';
import type { Datasets } from './composition';

/**
 * Transforms a single DataPack's schema into the key-value dataset format.
 * @param pack The DataPack to process.
 * @returns A Datasets object for the single pack.
 */
function dataPackToDataset(pack: DataPack): Datasets {
    const dataset: Datasets = {};
    const schema = pack.schema?.characterProfileSchema;
    if (!schema) return dataset;

    for (const [key, value] of Object.entries(schema)) {
        if (Array.isArray(value)) {
            dataset[key] = (dataset[key] || []).concat(value);
        } else if (typeof value === 'object' && value !== null) {
            for (const [subKey, subValue] of Object.entries(value)) {
                if (Array.isArray(subValue)) {
                    const combinedKey = `${key}_${subKey}`;
                    dataset[combinedKey] = (dataset[combinedKey] || []).concat(subValue);
                }
            }
        }
    }
    return dataset;
}

/**
 * Fetches all DataPacks from Supabase and transforms them into a simple
 * key-value dataset suitable for the template engine.
 * @returns A promise that resolves to the datasets object.
 */
export async function loadDatasetsFromSupabase(): Promise<Datasets> {
    const supabase = getSupabaseServerClient();
    
    try {
        const { data: allPacks, error } = await supabase
            .from('datapacks')
            .select('*');

        if (error) {
            console.error('Error fetching datapacks from Supabase:', error);
            throw new Error(`Failed to fetch datapacks: ${error.message}`);
        }

        const combinedDataset: Datasets = {};
        for (const pack of allPacks || []) {
            const packDataset = dataPackToDataset(pack as DataPack);
            for (const key in packDataset) {
                if (combinedDataset[key]) {
                    combinedDataset[key].push(...packDataset[key]);
                } else {
                    combinedDataset[key] = packDataset[key];
                }
            }
        }
        return combinedDataset;
    } catch (error) {
        console.error('Error loading datasets from Supabase:', error);
        throw new Error('Failed to load datasets from Supabase');
    }
}

// Keep the old function name for backward compatibility
export const loadDatasetsFromFirestore = loadDatasetsFromSupabase;
