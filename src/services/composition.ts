
/**
 * @fileoverview The core algorithmic engine for the Prompt Architect system.
 * This service contains the logic for intelligent prompt composition, including
 * weighted selection, and recursive template expansion for nested wildcards.
 */

import type { DataPack, Option } from '@/types/datapack';

// #region Helper Types
export type Datasets = Record<string, Option[]>;
// #endregion


// #region Pareto-Weighted Picker

/**
 * Selects an item from a list using a Pareto-like weighted distribution if rarity is present,
 * otherwise picks a random item.
 * This makes the function robust and compatible with all DataPacks.
 * @param items - The list of items to choose from.
 * @param alpha - The Pareto distribution parameter. Higher values create a steeper curve.
 * @returns The chosen item.
 */
export function paretoWeightedChoice(items: Option[], alpha: number = 1.5): Option {
    if (!items || items.length === 0) {
        // Return a default empty option to prevent crashes.
        return { label: '', value: '' };
    }
    
    // Check if the items actually have rarity defined. If not, default to random choice.
    const hasRarity = items.some(item => typeof item.rarity === 'number');

    if (!hasRarity) {
        return items[Math.floor(Math.random() * items.length)];
    }
    
    const sortedItems = [...items].sort((a, b) => (b.rarity || 1) - (a.rarity || 1));

    const n = sortedItems.length;
    const weights = Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, alpha));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;

    for (let i = 0; i < n; i++) {
        const weight = weights[i];
        if (weight !== undefined) {
             random -= weight;
            if (random <= 0) {
                return sortedItems[i]!;
            }
        }
    }
    
    return sortedItems[n - 1]!; // Fallback to the last item
}
// #endregion


// #region Template Engine
const PLACEHOLDER_RE = /\{([^{}]+)\}/g;

/**
 * Recursively expands a template string, resolving placeholders.
 * Supports simple choices like {a|b|c} and nested placeholders.
 * @param template - The string template to expand.
 * @param datasets - A dictionary-like object containing the available wildcard options.
 * @param recursionLimit - A safety limit to prevent infinite loops.
 * @returns The fully expanded string.
 */
export function expandTemplate(template: string, datasets: Datasets, recursionLimit = 10): string {
    if (recursionLimit <= 0) {
        console.warn("Template expansion recursion limit reached. Check for circular dependencies.");
        return template;
    }

    let needsAnotherPass = false;
    
    const expanded = template.replace(PLACEHOLDER_RE, (match, key) => {
        key = key.trim();
        
        // Handle choice syntax first {a|b|c}
        if (key.includes('|')) {
            const options = key.split('|');
            needsAnotherPass = true;
            return options[Math.floor(Math.random() * options.length)].trim();
        }
        
        // Handle dataset placeholders
        const datasetOptions = datasets[key];
        if (datasetOptions && datasetOptions.length > 0) {
            const chosenOption = paretoWeightedChoice(datasetOptions);
            needsAnotherPass = true;
            return chosenOption.value;
        }

        // Return placeholder if not found
        return match;
    });

    // If any replacements were made, recurse to handle nested placeholders
    if (needsAnotherPass && expanded !== template) {
        return expandTemplate(expanded, datasets, recursionLimit - 1);
    }
    
    return expanded;
}
// #endregion

/**
 * Transforms a single DataPack's schema into the key-value dataset format.
 * This function is safe to use on the client.
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
 * Converts a specific DataPack into a dataset for isolated prompt generation.
 * This is the new standard way to get options for the generator and is client-safe.
 * @param pack The DataPack to convert.
 * @returns A Datasets object containing only options from the provided pack.
 */
export function getDatasetForDataPack(pack: DataPack): Datasets {
    return dataPackToDataset(pack);
}


/**
 * Creates an "inverted index" map from an option's value to its slot key.
 * This is used for efficiently finding alternative options for a given tag.
 * e.g., { "wearing a leather jacket": "torso_clothing", "plate armor": "torso_armor" }
 * @param dataset The flattened dataset from a DataPack.
 * @returns A Map where keys are option values and values are slot keys.
 */
export function createInvertedDatasetMap(dataset: Datasets): Map<string, string> {
    const invertedMap = new Map<string, string>();
    for (const slotKey in dataset) {
        const options = dataset[slotKey];
        if (Array.isArray(options)) {
            for (const option of options) {
                if (option.value) { // Ensure the option has a value
                    invertedMap.set(option.value, slotKey);
                }
            }
        }
    }
    return invertedMap;
}

/**
 * Finds the corresponding slot key for a given tag from the prompt by checking
 * if any known option value is a substring of the tag.
 * @param tag The tag from the prompt (e.g., "a beautiful woman wearing a leather jacket").
 * @param invertedMap The pre-computed inverted map of the dataset.
 * @returns The matching slot key (e.g., "torso_clothing") or null if not found.
 */
export function findSlotKeyForTag(tag: string, invertedMap: Map<string, string>): string | null {
    // This is more robust. It finds the longest matching key to avoid ambiguity.
    // e.g., if keys are "hat" and "red hat", and tag is "wearing a red hat", it will match "red hat".
    let bestMatch: string | null = null;
    let bestMatchLength = 0;
    
    for (const [optionValue, slotKey] of invertedMap.entries()) {
        if (tag.includes(optionValue) && optionValue.length > bestMatchLength) {
            bestMatch = slotKey;
            bestMatchLength = optionValue.length;
        }
    }
    return bestMatch;
}
