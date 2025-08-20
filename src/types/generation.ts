/**
 * @fileoverview This file contains data types related to the AI generation process
 * that are safe to be used in Client Components. It avoids importing server-only
 * dependencies like Genkit, preventing build errors.
 */

import { z } from 'zod';
import type { AiModel } from './ai-model';

/**
 * Defines the configuration for a text-generation engine.
 * Safe for client-side use.
 */
export const TextEngineConfigSchema = z.object({
  engineId: z.enum(['gemini', 'openrouter']),
  modelId: z.string(),
  userApiKey: z.string().optional(),
});
export type TextEngineConfig = z.infer<typeof TextEngineConfigSchema>;

/**
 * Defines the configuration for an image-generation engine.
 * Safe for client-side use.
 */
export interface ImageEngineConfig {
  engineId: 'huggingface' | 'gemini' | 'openrouter' | 'vertexai' | 'comfyui' | 'modelslab';
  modelId?: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  lora?: {
    id: string;
    weight?: number;
    triggerWords?: string[];
  };
  userApiKey?: string;
  apiUrl?: string;
  comfyWorkflow?: object;
}


/**
 * The output shape of the character sheet generation flow.
 * Safe for client-side use.
 */
export interface GenerationResult {
  name: string;
  archetype?: string | null;
  equipment?: string[] | null;
  physicalDescription?: string | null;
  biography?: string | null;
  originalDescription?: string;
  imageUrl?: string | null;
  dataPackId?: string | null;
  textEngine?: TextEngineConfig['engineId'];
  imageEngine?: ImageEngineConfig['engineId'];
}
