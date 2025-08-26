
/**
 * @fileoverview The core algorithmic engine for the Prompt Architect system.
 * This service contains the logic for intelligent prompt composition, including
 * weighted selection, Markov chains for narrative coherence, and template expansion.
 */

import type { DataPack, Option } from '@/types/datapack';
import { adminDb } from '@/lib/firebase/server';

// #region Helper Types
type Datasets = Record<string, Option[]>;
// #endregion


// #region Pareto-Weighted Picker

/**
 * Selects an item from a list using a Pareto-like weighted distribution.
 * This makes lower-ranked (more common) items more likely to be chosen, while still allowing for rare picks.
 * @param items - The list of items to choose from. Each item must have a 'value' and can have a 'rarity' score.
 * @param alpha - The Pareto distribution parameter. Higher values create a steeper curve (more bias towards common items).
 * @returns The chosen item.
 */
export function paretoWeightedChoice(items: Option[], alpha: number = 1.5): Option {
    if (!items || items.length === 0) {
        // Return a default empty option to prevent crashes.
        return { label: '', value: '' };
    }
    
    // The previous implementation assumed items always had a 'rarity' property.
    // This version is now robust and handles cases where rarity is not defined by assigning a default.
    const sortedItems = [...items].sort((a, b) => (b.rarity || 1) - (a.rarity || 1));

    const n = sortedItems.length;
    const weights = Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, alpha));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;

    for (let i = 0; i < n; i++) {
        random -= weights[i];
        if (random <= 0) {
            return sortedItems[i];
        }
    }
    
    return sortedItems[n - 1]; // Fallback to the last item
}
// #endregion


// #region Markov Chain Generator
// A simple Markov Chain implementation for generating coherent sequences.
export class MarkovChainGenerator {
    private model: Map<string, string[]> = new Map();

    /**
     * Trains the Markov model on a set of sequences.
     * @param sequences - An array of string arrays, where each inner array is a sequence.
     */
    train(sequences: string[][]): void {
        for (const sequence of sequences) {
            if (sequence.length === 0) continue;
            
            this.model.set('__START__', [...(this.model.get('__START__') || []), sequence[0]]);

            for (let i = 0; i < sequence.length - 1; i++) {
                const current = sequence[i];
                const next = sequence[i + 1];
                const transitions = this.model.get(current) || [];
                this.model.set(current, [...transitions, next]);
            }
        }
    }

    /**
     * Generates a new sequence from the trained model.
     * @param maxLength - The maximum length of the generated sequence.
     * @returns A new sequence of strings.
     */
    generate(maxLength: number = 5): string[] {
        let current = this.getRandomElement(this.model.get('__START__'));
        if (!current) return [];

        const result = [current];
        for (let i = 1; i < maxLength; i++) {
            const nextStates = this.model.get(current);
            if (!nextStates || nextStates.length === 0) break;
            
            current = this.getRandomElement(nextStates)!;
            result.push(current);
        }
        return result;
    }

    private getRandomElement(array?: string[]): string | undefined {
        if (!array || array.length === 0) return undefined;
        return array[Math.floor(Math.random() * array.length)];
    }
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
        if (datasets[key] && datasets[key].length > 0) {
            const chosenOption = paretoWeightedChoice(datasets[key]);
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
 * Fetches all DataPacks from Firestore and transforms them into a simple
 * key-value dataset suitable for the template engine.
 * @returns A promise that resolves to the datasets object.
 */
export async function loadDatasetsFromFirestore(): Promise<Datasets> {
    if (!adminDb) {
        throw new Error("Firestore is not initialized.");
    }
    const snapshot = await adminDb.collection('datapacks').get();
    const datasets: Datasets = {};

    snapshot.forEach(doc => {
        const pack = doc.data() as DataPack;
        if (pack.schema && pack.schema.characterProfileSchema) {
            for (const [key, value] of Object.entries(pack.schema.characterProfileSchema)) {
                 if (Array.isArray(value)) {
                    datasets[key] = (datasets[key] || []).concat(value);
                 } else if (typeof value === 'object' && value !== null) {
                    for (const subValue of Object.values(value)) {
                         if (Array.isArray(subValue)) {
                             datasets[key] = (datasets[key] || []).concat(subValue);
                         }
                    }
                 }
            }
        }
    });

    return datasets;
}
