
/**
 * @fileOverview Data schemas and types for the character image generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import {z} from 'genkit';

// This defines the configuration for a LoRA within the engine.
const LoraConfigSchema = z.object({
  id: z.string().describe("The Civitai ID of the LoRA model."),
  versionId: z.string().describe("The specific version ID of the LoRA to use."),
  weight: z.number().min(0).max(1).optional().default(0.75).describe("The weight to apply to the LoRA."),
  triggerWords: z.array(z.string()).optional().describe("Specific trigger words for the LoRA."),
});

// This is the new, centralized configuration object for any image engine.
export const ImageEngineConfigSchema = z.object({
  engineId: z.enum(['huggingface', 'gemini']).describe('The generation engine to use.'),
  modelId: z.string().optional().describe('The identifier for the base model (e.g., "stabilityai/stable-diffusion-xl-base-1.0" for Hugging Face).'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('1:1').describe('The desired aspect ratio for the image.'),
  lora: LoraConfigSchema.optional().describe('Configuration for the LoRA to apply, if any.'),
  userApiKey: z.string().optional().describe("An optional, user-provided API key for the Hugging Face engine."),
});
export type ImageEngineConfig = z.infer<typeof ImageEngineConfigSchema>;


// The input to the main flow is now much simpler.
export const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
  engineConfig: ImageEngineConfigSchema.describe('The complete configuration for the image generation engine.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;


export const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;
