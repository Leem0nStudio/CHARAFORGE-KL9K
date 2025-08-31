
'use server';

/**
 * @fileOverview An AI agent for orchestrating the generation of complex, narrative prompts
 * using the Prompt Architect system.
 */

import { ai } from '@/ai/genkit';
import { GenerateArchitectPromptInputSchema, GenerateArchitectPromptOutputSchema, type GenerateArchitectPromptInput, type GenerateArchitectPromptOutput } from './types';
import { expandTemplate } from '@/services/composition';
import { loadDatasetsFromFirestore } from '@/services/composition.server'; // Correctly import the server-only function
import architectPack from '@/data/datapacks/prompt-architect/datapack.json'; // Direct import of the architect's own data

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
    
    // 1. Load all available wildcards and module templates from Firestore using the server-only function.
    const datasets = await loadDatasetsFromFirestore();
    
    // 2. Load the architect's own templates directly from the imported JSON file.
    const templates = architectPack.schema?.promptTemplates || [];
    const focusTemplate = templates.find((t) => t.name.toLowerCase().replace(/ /g, '_') === focusModule);

    if (!focusTemplate) {
        throw new Error(`The focus module '${focusModule}' could not be found in the Prompt Architect DataPack.`);
    }

    // 3. Expand the chosen template using the composition service.
    // The expandTemplate function now handles the Pareto selection internally.
    const finalPrompt = expandTemplate(focusTemplate.template, datasets);

    return { prompt: finalPrompt, seed: finalSeed };
  }
);
