
'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description,
 * using a selectable engine (Gradio or Gemini).
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
    const { description, aspectRatio, engine } = input;

    if (engine === 'gemini') {
        try {
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: description,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                    aspectRatio: aspectRatio,
                },
            });
            const imageUrl = media?.url;
            if (!imageUrl) {
                throw new Error('Gemini AI model failed to generate an image.');
            }
            return { imageUrl };
        } catch (error) {
            console.error("Error generating image with Gemini:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred with the Gemini engine.";
            throw new Error(`Failed to generate character image via Gemini. ${message}`);
        }
    } else { // Default to Gradio
        try {
            const { width, height } = getDimensions(aspectRatio);
            const client = await Client.connect("dhead/waiNSFWIllustrious_v130_Space");

            const result = await client.predict("/infer", {
                prompt: description,
                negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
                seed: Math.floor(Math.random() * 1_000_000_000),
                randomize_seed: true,
                width: width,
                height: height,
                guidance_scale: 7,
                num_inference_steps: 25,
            });

            const imageUrl = Array.isArray(result.data) ? result.data[0] : null;
            if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('data:image')) {
                throw new Error('The Gradio API did not return a valid image data URI. The remote service might be down or the request was rejected.');
            }
            return { imageUrl };

        } catch (error) {
            console.error("Error in generateCharacterImageFlow (Gradio):", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(`Failed to generate character image via the external API. ${message}`);
        }
    }
  }
);
