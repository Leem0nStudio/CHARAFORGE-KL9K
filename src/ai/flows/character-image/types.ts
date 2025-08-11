
import {z} from 'genkit';

export const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('1:1').describe('The desired aspect ratio for the image.'),
  imageEngine: z.enum(['huggingface', 'gemini']).default('huggingface').describe('The generation engine to use.'),
  hfModelId: z.string().optional().describe('The Hugging Face identifier for the base model (e.g., "stabilityai/stable-diffusion-xl-base-1.0"). Required if engine is "huggingface".'),
  lora: z.string().optional().describe('The Hugging Face identifier for a LoRA (e.g., YourUsername/YourLoRA).'),
  loraWeight: z.number().min(0).max(1).optional().describe('The weight to apply to the LoRA.'),
  triggerWords: z.string().optional().describe('Specific trigger words for the LoRA, joined by commas.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

export const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;
