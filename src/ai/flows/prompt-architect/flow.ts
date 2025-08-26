
'use server';

/**
 * @fileOverview An AI agent for orchestrating the generation of complex, narrative prompts
 * using the Prompt Architect system.
 */

import { ai } from '@/ai/genkit';
import { GenerateArchitectPromptInputSchema, GenerateArchitectPromptOutputSchema, type GenerateArchitectPromptInput, type GenerateArchitectPromptOutput } from './types';
import { expandTemplate, loadDatasetsFromFirestore } from '@/services/composition';
import { adminDb } from '@/lib/firebase/server';

export async function generateArchitectPrompt(input: GenerateArchitectPromptInput): Promise<GenerateArchitectPromptOutput> {
  return generateArchitectPromptFlow(input);
}

const generateArchitectPromptFlow = ai.defineFlow(
  {
    name: 'generateArchitectPromptFlow',
    inputSchema: GenerateArchitectPromptInputSchema,
    outputSchema: GenerateArchitectPromptOutputSchema,
  },
  async ({ focusModule, seed }) => {
    
    const finalSeed = seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    
    if (!adminDb) {
        throw new Error("Database service is unavailable.");
    }
    
    // 1. Load all available wildcards and module templates from Firestore.
    const datasets = await loadDatasetsFromFirestore();
    
    // CRITICAL FIX: Fetch the document directly by its known ID ('prompt-architect')
    // This is more reliable and efficient than querying by name.
    const moduleDoc = await adminDb.collection('datapacks').doc('prompt-architect').get();
    
    if (!moduleDoc.exists) {
        throw new Error("Could not find the 'Prompt Architect' DataPack containing the required focus modules.");
    }
    const moduleData = moduleDoc.data();
    const templates = moduleData?.schema?.promptTemplates || [];
    const focusTemplate = templates.find((t: any) => t.name.toLowerCase().replace(/ /g, '_') === focusModule);

    if (!focusTemplate) {
        throw new Error(`The focus module '${focusModule}' could not be found in the Prompt Architect DataPack.`);
    }

    // 2. Expand the chosen template using the composition service.
    // The expandTemplate function now handles the Pareto selection internally.
    const finalPrompt = expandTemplate(focusTemplate.template, datasets);

    return { prompt: finalPrompt, seed: finalSeed };
  }
);
