
import {z} from 'genkit';

export const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('1:1').describe('The desired aspect ratio for the image.'),
  imageEngine: z.enum(['gradio', 'gemini']).default('gradio').describe('The generation engine to use. "gradio" connects to a Stable Diffusion model on Hugging Face.'),
  lora: z.string().optional().describe('The Hugging Face identifier for a LoRA (e.g., YourUsername/YourLoRA).'),
  loraWeight: z.number().min(0).max(1).optional().describe('The weight to apply to the LoRA.'),
  triggerWords: z.string().optional().describe('Specific trigger words for the LoRA.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

export const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;
