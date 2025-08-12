import { z } from 'zod';

export const SuggestHfModelInputSchema = z.object({
  modelName: z.string().describe("The name of the Civitai model or LoRA (e.g., 'Classic Animation Style', '80s Sci-Fi')."),
});
export type SuggestHfModelInput = z.infer<typeof SuggestHfModelInputSchema>;

export const SuggestHfModelOutputSchema = z.object({
  suggestedHfId: z.string().describe("The suggested Hugging Face repository ID for the base model (e.g., 'stabilityai/stable-diffusion-xl-base-1.0')."),
});
export type SuggestHfModelOutput = z.infer<typeof SuggestHfModelOutputSchema>;
