
'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description,
 * using a selectable engine (Gradio for Stable Diffusion or Gemini).
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
    const { description, aspectRatio, imageEngine, lora } = input;

    if (imageEngine === 'gemini') {
        // This branch uses Google's native image generation model.
        try {
            const { width, height } = getDimensions(aspectRatio);

            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: description,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                    width,
                    height,
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
    } else { 
        // This branch connects to a community-hosted Stable Diffusion model on Hugging Face
        // using the Gradio client library.
        try {
            const { width, height } = getDimensions(aspectRatio);
            
            // Step 1: Connect to a Gradio app that supports LoRAs.
            // The string "hysts/SD-XL-Lightning-Gradio" is the ID of a powerful Space.
            const client = await Client.connect("hysts/SD-XL-Lightning-Gradio");

            // Step 2: Call the prediction function of that Gradio app.
            // We pass the prompt, LoRA, and other parameters to the model.
            const result = await client.predict("/run", {
                prompt: description,
                lora: lora || "None", // Pass the LoRA name or "None"
                negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
                seed: Math.floor(Math.random() * 1_000_000_000),
                width: width,
                height: height,
                guidance_scale: 0,
                num_inference_steps: 4, // SDXL-Lightning is very fast
                sampler: "DPM++ SDE Karras",
            });

            // Step 3: Process the result. The image comes back as a Data URI.
            const imageUrl = Array.isArray(result.data) ? result.data[0] : null;
            if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('data:image')) {
                throw new Error('The Gradio API did not return a valid image data URI. The remote service might be down or the request was rejected.');
            }
            return { imageUrl };

        } catch (error) {
            console.error("Error in generateCharacterImageFlow (Gradio/Stable Diffusion):", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
             if (message.includes('Space metadata could not be loaded')) {
                throw new Error('The Gradio service (Stable Diffusion) is currently unavailable. Please try again later or switch to the Gemini engine.');
            }
            throw new Error(`Failed to generate character image via the external API. ${message}`);
        }
    }
  }
);
