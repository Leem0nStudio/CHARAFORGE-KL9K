/**
 * @fileOverview A centralized utility for querying different Large Language Models.
 * This acts as a switchboard to route requests to the appropriate AI engine
 * (e.g., Google AI, OpenRouter) based on the provided configuration.
 */

import { z } from 'zod';
import { generate } from 'genkit';
import { ai } from '@/ai/genkit';
import type { GenerationCommonOptions } from 'genkit/ai';


// This is the configuration for any text-generation engine.
export const TextEngineConfigSchema = z.object({
  engineId: z.enum(['gemini', 'openrouter']).describe('The generation engine to use.'),
  modelId: z.string().describe('The identifier for the base model (e.g., "googleai/gemini-1.5-flash-latest" or "openai/gpt-4o").'),
  userApiKey: z.string().optional().describe("An optional, user-provided API key for the selected engine."),
});
export type TextEngineConfig = z.infer<typeof TextEngineConfigSchema>;


/**
 * Queries a Large Language Model (LLM) using a specified engine.
 * @param config - The configuration specifying which engine and model to use.
 * @param prompt - The prompt to send to the model.
 * @param outputSchema - The Zod schema to validate the model's output against.
 * @returns A promise that resolves to the validated output from the LLM.
 */
export async function queryLlm<T extends z.ZodTypeAny>(
  config: TextEngineConfig,
  prompt: string | (string | { media: { url: string } })[],
  outputSchema: T
): Promise<z.infer<T>> {
  const { engineId, modelId, userApiKey } = config;

  let requestConfig: GenerationCommonOptions | undefined;
  let reference;

  if (engineId === 'openrouter') {
    const systemApiKey = process.env.OPENROUTER_API_KEY;
    const apiKey = userApiKey || systemApiKey;

    if (!apiKey) {
      throw new Error(`OpenRouter API key is not configured on the server or provided by the user.`);
    }

    reference = ai.model(modelId, {
      config: {
        apiKey,
        // OpenRouter uses the OpenAI API format, so we can specify the provider.
        // This helps Genkit use the correct request structure.
        provider: 'openai', 
      }
    });

  } else { // Default to 'gemini'
    reference = ai.model(modelId);
  }

  const { output } = await generate({
    model: reference,
    prompt: prompt,
    output: {
        schema: outputSchema,
    },
    config: requestConfig,
  });

  return output;
}
