
'use server';

/**
 * @fileOverview An AI agent for suggesting a suitable Hugging Face base model
 * for a given Civitai LoRA or model name.
 */

import { ai } from '@/ai/genkit';
import { searchHuggingFaceModels } from '@/app/actions/huggingface';
import { SuggestHfModelInputSchema, SuggestHfModelOutputSchema, type SuggestHfModelInput, type SuggestHfModelOutput } from './types';
import { z } from 'zod';


// Define the Genkit Tool that wraps our Hugging Face search service.
const searchHfModelsTool = ai.defineTool(
  {
    name: 'searchHfModelsTool',
    description: 'Searches the Hugging Face Hub for text-to-image models that match a given query.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.object({ id: z.string(), pipeline_tag: z.string() })),
  },
  async ({ query }) => searchHuggingFaceModels(query)
);


export async function suggestHfModel(
  input: SuggestHfModelInput
): Promise<SuggestHfModelOutput> {
  return suggestHfModelFlow(input);
}


const prompt = ai.definePrompt({
  name: 'suggestHfModelPrompt',
  input: { schema: SuggestHfModelInputSchema },
  output: { schema: SuggestHfModelOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [searchHfModelsTool],
  prompt: `You are an expert assistant for a character creation application. Your task is to find the most suitable and reliable Hugging Face base model ID for a given model name, which is likely a LoRA from Civitai.

  Model Name: {{{modelName}}}

  Instructions:
  1. Analyze the model name to understand its purpose (e.g., style, character, concept).
  2. Use the 'searchHfModelsTool' to search for foundational text-to-image models. Good search terms are "stable-diffusion-xl-base", "sdxl", or "stable-diffusion-v1-5".
  3. From the search results, identify the most standard, official, and widely used base model. Prioritize official StabilityAI models like 'stabilityai/stable-diffusion-xl-base-1.0'. This is ALMOST ALWAYS the correct choice.
  4. Return the ID of the single best base model in the 'suggestedHfId' field. Do not suggest fine-tuned or obscure models unless the input model name clearly indicates it's a fine-tune of a specific non-SDXL model.
  `,
});


const suggestHfModelFlow = ai.defineFlow(
  {
    name: 'suggestHfModelFlow',
    inputSchema: SuggestHfModelInputSchema,
    outputSchema: SuggestHfModelOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to suggest a Hugging Face model.');
    }
    return output;
  }
);
