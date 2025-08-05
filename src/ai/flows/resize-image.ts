'use server';

/**
 * @fileOverview An AI agent for resizing an image to a web-friendly dimension.
 *
 * - resizeImage - A function that takes a large image data URI and returns a smaller one.
 * - ResizeImageInput - The input type for the resizeImage function.
 * - ResizeImageOutput - The return type for the resizeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResizeImageInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "The original image as a data URI, which must include a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ResizeImageInput = z.infer<typeof ResizeImageInputSchema>;

const ResizeImageOutputSchema = z.object({
  resizedImageUrl: z
    .string()
    .describe('The resized 512x512 image as a data URI.'),
});
export type ResizeImageOutput = z.infer<typeof ResizeImageOutputSchema>;

export async function resizeImage(
  input: ResizeImageInput
): Promise<ResizeImageOutput> {
  return resizeImageFlow(input);
}

const resizeImageFlow = ai.defineFlow(
  {
    name: 'resizeImageFlow',
    inputSchema: ResizeImageInputSchema,
    outputSchema: ResizeImageOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest', 
        prompt: [
          { text: "Resize the following image to be exactly 512x512 pixels. Maintain the original aspect ratio by cropping if necessary, focusing on the main subject. Do not add any new elements or change the style. Output only the image." },
          { media: { url: input.imageUrl } },
        ],
        config: {
          // Specify output format if needed, though the model typically handles it.
        },
      });

      const resizedImageUrl = media?.url;
      if (!resizedImageUrl) {
        throw new Error('AI model failed to resize the image.');
      }

      return { resizedImageUrl };
    } catch (error) {
      console.error("Error resizing image:", error);
      throw new Error("Failed to resize image. The AI service may be unavailable.");
    }
  }
);
