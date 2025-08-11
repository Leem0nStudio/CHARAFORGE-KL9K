
'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description,
 * using a selectable engine (Hugging Face Inference API for Stable Diffusion or Gemini).
 */

import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';
import { Client } from "@gradio/client";

// Helper function to get image dimensions in pixels.
function getDimensions(aspectRatio: '1:1' | '16:9' | '9:16' | undefined) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1216, height: 832 };
    case '9:16':
      return { width: 832, height: 1216 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Queries the Hugging Face Inference API for a specific model.
 * This is the new, more robust method for generating images with Stable Diffusion.
 * @param {object} data The payload to send to the model.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryHuggingFaceInferenceAPI(data: object): Promise<string> {
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
    if (!HUGGING_FACE_API_KEY) {
        throw new Error("Hugging Face API key is not configured on the server.");
    }
    
    // Using a recommended open-source model for high-quality images.
    const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    const response = await fetch(API_URL, {
        headers: {
            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Hugging Face API Error:", errorBody);
        throw new Error(`Failed to generate image via Hugging Face API. Status: ${response.status}. Message: ${errorBody}`);
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return `data:${imageBlob.type};base64,${base64}`;
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
    const { description, aspectRatio, imageEngine, lora, loraWeight, triggerWords } = input;

    if (imageEngine === 'gemini') {
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
        // This branch now uses the robust Hugging Face Inference API.
        try {
            let promptWithLora = description;
            if (lora) {
                const weight = loraWeight || 0.75;
                const loraTag = `<lora:${lora}:${weight}>`;
                const words = triggerWords ? `${triggerWords}, ` : '';
                promptWithLora = `${words}${description}, ${loraTag}`;
            }

            const imageUrl = await queryHuggingFaceInferenceAPI({ 
                inputs: promptWithLora,
                parameters: {
                    negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
                }
            });
            
            if (!imageUrl) {
                 throw new Error('The Hugging Face API did not return a valid image.');
            }
            return { imageUrl };

        } catch (error) {
            console.error("Error in generateCharacterImageFlow (Hugging Face API):", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(`Failed to generate character image via the Hugging Face API. ${message}`);
        }
    }
  }
);
