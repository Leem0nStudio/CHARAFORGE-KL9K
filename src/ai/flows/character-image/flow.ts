
'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description,
 * using a third-party Gradio API.
 */

import { ai } from '@/ai/genkit';
import { Client } from '@gradio/client';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';


// Helper function to determine the image dimensions based on the desired aspect ratio.
function getDimensions(aspectRatio: '1:1' | '16:9' | '9:16' | undefined) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1216, height: 832 };
    case '9:16':
      return { width: 832, height: 1216 };
    case '1:1':
    default:
      // Using a higher resolution for better quality.
      return { width: 1024, height: 1024 };
  }
}

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
  async (input) => {
    try {
      const { width, height } = getDimensions(input.aspectRatio);

      // Connect to the public Gradio Space API for image generation.
      const client = await Client.connect("dhead/waiNSFWIllustrious_v130_Space");

      // Call the 'predict' function on the '/infer' endpoint with the appropriate parameters.
      const result = await client.predict("/infer", {
        prompt: input.description,
        negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
        // Use a random seed for varied results on each generation.
        seed: Math.floor(Math.random() * 1_000_000_000),
        randomize_seed: true,
        width: width,
        height: height,
        // These are common default values for stable diffusion models.
        guidance_scale: 7,
        num_inference_steps: 25,
      });

      // The result.data from Gradio client is typically an array containing the image data URI.
      // We extract the first element which should be the image.
      const imageUrl = Array.isArray(result.data) ? result.data[0] : null;

      // Validate that the returned data is a valid image data URI.
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('data:image')) {
        throw new Error('The Gradio API did not return a valid image data URI. The remote service might be down or the request was rejected.');
      }

      return { imageUrl };

    } catch (error) {
      // Log the detailed error on the server for easier debugging.
      console.error("Error in generateCharacterImageFlow (Gradio):", error);
      
      // Provide a user-friendly error message.
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      throw new Error(`Failed to generate character image via the external API. ${message}`);
    }
  }
);
