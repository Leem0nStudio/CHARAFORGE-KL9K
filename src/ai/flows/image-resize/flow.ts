
'use server';

/**
 * @fileOverview An AI agent for resizing an image to a web-friendly dimension.
 */

import {ai} from '@/ai/genkit';
import { ResizeImageInputSchema, ResizeImageOutputSchema, type ResizeImageInput, type ResizeImageOutput } from './types';


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
        // Using a model specialized for image manipulation tasks improves reliability.
        model: 'googleai/gemini-2.0-flash-preview-image-generation', 
        prompt: [
          // A simpler, more direct prompt is more reliable for image manipulation tasks.
          { text: "Resize the following image to 512x512 pixels." },
          { media: { url: input.imageUrl } },
        ],
        config: {
          // This specific model requires both modalities to be specified.
          responseModalities: ['TEXT', 'IMAGE'],
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
