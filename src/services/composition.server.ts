

'use server';

/**
 * @fileoverview This service contains functions for the composition engine
 * that previously required server-only dependencies like the Firebase Admin SDK.
 * Now it uses the Supabase client.
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
export async function loadDatasetsFromFirestore(): Promise<Datasets> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        throw new Error("Supabase client is not initialized.");
    }

    const { data: allPacks, error } = await supabase.from('datapacks').select('*');
    if (error) {
        console.error("Error fetching datapacks from Supabase:", error);
        throw new Error("Could not load DataPacks from the database.");
    }
    
    const combinedDataset: Datasets = {};
    for (const pack of allPacks) {
        // The pack from Supabase needs its schema_details mapped to schema
        const packWithSchema = { ...pack, schema: pack.schema_details } as unknown as DataPack;
        const packDataset = dataPackToDataset(packWithSchema);
        for (const key in packDataset) {
            if(combinedDataset[key]) {
                 combinedDataset[key].push(...packDataset[key]);
            } else {
                combinedDataset[key] = packDataset[key];
            }
        }
    }
    return combinedDataset;
}
