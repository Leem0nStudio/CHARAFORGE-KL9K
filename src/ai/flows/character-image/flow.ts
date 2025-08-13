
'use server';

/**
 * @fileOverview An AI agent for generating character images.
 * This flow is now fully data-driven by the engineConfig object.
 */

import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput, type ImageEngineConfig } from './types';
import { client } from "@gradio/client";

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
 * Queries a Hugging Face Space using the Gradio client.
 * It prioritizes a user-provided API key and falls back to the system key.
 * @param {object} data The payload including inputs, model HF ID, and optional user API key.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryHuggingFaceInferenceAPI(data: { inputs: string, modelId: string, userApiKey?: string }): Promise<string> {
    const systemApiKey = process.env.HUGGING_FACE_API_KEY;
    const apiKey = data.userApiKey || systemApiKey;

    if (!apiKey) {
        throw new Error("Hugging Face API key is not configured on the server or provided by the user.");
    }
    
    try {
        // The modelId should be the Gradio Space ID, e.g., "klaabu/illustrious-nxt"
        const app = await client(data.modelId, { hf_token: apiKey as `hf_${string}` });
        const result = await app.predict("/run", {
            prompt: data.inputs,
            negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
            width: 1024,
            height: 1024,
        });

        // The result from Gradio might be structured. We need to find the image data.
        if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data) && result.data.length > 0) {
            const imageResult = result.data[0];
            if (typeof imageResult === 'string' && imageResult.startsWith('data:image')) {
                return imageResult;
            }
        }
        
        throw new Error("Received an unexpected response format from the Gradio API.");

    } catch (error) {
        console.error("Gradio/Hugging Face API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to generate image via Hugging Face. Error: ${message}`);
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
    const { description, engineConfig } = input;
    const { engineId, modelId, aspectRatio, userApiKey } = engineConfig;
    
    let imageUrl: string | undefined;

    if (engineId === 'gemini') {
        try {
            const { width, height } = getDimensions(aspectRatio);
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: description,
                width: width,
                height: height,
                config: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            });
            imageUrl = media?.url;
        } catch (error) {
            console.error("Error generating image with Gemini:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred with the Gemini engine.";
            throw new Error(`Failed to generate character image via Gemini. ${message}`);
        }
    } else if (engineId === 'huggingface') {
        try {
            if (!modelId) {
                throw new Error("Hugging Face model ID is required for this engine.");
            }

            imageUrl = await queryHuggingFaceInferenceAPI({ 
                inputs: description,
                modelId: modelId,
                userApiKey: userApiKey,
            });

        } catch (error) {
            console.error("Error in Hugging Face flow:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(message);
        }
    } else {
        throw new Error(`Unsupported image engine: ${engineId}`);
    }

    if (!imageUrl) {
        throw new Error(`The ${engineId} engine failed to return a valid image.`);
    }

    return { imageUrl };
  }
);
