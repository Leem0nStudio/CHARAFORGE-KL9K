'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description.
 *
 * - generateCharacterImage - A function that handles the character image generation process.
 * - GenerateCharacterImageInput - The input type for the generateCharacterImage function.
 * - GenerateCharacterImageOutput - The return type for the generateCharacterImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;

export async function generateCharacterImage(
  input: GenerateCharacterImageInput
): Promise<GenerateCharacterImageOutput> {
  return generateCharacterImageFlow(input);
}

const generateCharacterImageFlow = ai.defineFlow(
  {
    name: 'generateCharacterImageFlow',
    inputSchema: GenerateCharacterImageInputSchema,
    outputSchema: GenerateCharacterImageOutputSchema,
  },
  async input => {
    try {
        const {media} = await ai.generate({
        // IMPORTANT: The 'gemini-2.0-flash-preview-image-generation' model is currently specified for image generation.
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a photorealistic portrait of a character based on the following description: ${input.description}`,
        config: {
            // Both TEXT and IMAGE modalities are required for this specific model to work correctly.
            responseModalities: ['TEXT', 'IMAGE'],
        },
        });

        const imageUrl = media?.url;
        if (!imageUrl) {
          // This error is critical for debugging if the AI model fails to return an image URL.
          throw new Error('AI model did not return an image. This could be due to safety filters or an API issue.');
        }

        return {imageUrl};
    } catch (error) {
        console.error("Error generating character image:", error);
        // Re-throwing the error ensures the client-side catch block can handle it.
        throw new Error("Failed to generate character image. The AI service may be temporarily unavailable or the prompt may have been rejected.");
    }
  }
);
