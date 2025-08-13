
'use server';

/**
 * @fileOverview An AI agent for generating character images.
 * This flow is now fully data-driven by the engineConfig object.
 */

import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput, type ImageEngineConfig } from './types';

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
 * It prioritizes a user-provided API key and falls back to the system key.
 * @param {object} data The payload to send, including inputs, model, and optional user API key.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryHuggingFaceInferenceAPI(data: { inputs: string, model: string, userApiKey?: string }): Promise<string> {
    const systemApiKey = process.env.HUGGING_FACE_API_KEY;
    const apiKey = data.userApiKey || systemApiKey;

    if (!apiKey) {
        throw new Error("Hugging Face API key is not configured on the server or provided by the user.");
    }
    
    const API_URL = `https://api-inference.huggingface.co/models/${data.model}`;
    
    const response = await fetch(API_URL, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            inputs: data.inputs,
            parameters: {
                negative_prompt: "blurry, low quality, bad anatomy, deformed, disfigured, poor details, watermark, text, signature",
            }
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Hugging Face API Error:", errorBody);
        const errorMessage = errorBody.includes('Rate limit reached')
          ? "The API rate limit was reached. Please try again later or add your own API key in your profile settings."
          : `Failed to generate image via Hugging Face. Status: ${response.status}. Message: ${errorBody}`;
        throw new Error(errorMessage);
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
    const { description, engineConfig } = input;
    const { engineId, modelId, aspectRatio, lora, userApiKey } = engineConfig;
    
    let imageUrl: string | undefined;

    if (engineId === 'gemini') {
        try {
            const { width, height } = getDimensions(aspectRatio);
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: description,
                // CRITICAL FIX: width and height are top-level parameters, not part of 'config'
                width,
                height,
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
            
            let promptWithLora = description;
            if (lora && lora.triggerWords) {
                const words = lora.triggerWords.join(', ');
                promptWithLora = `${words}, ${description}`;
            }

            imageUrl = await queryHuggingFaceInferenceAPI({ 
                inputs: promptWithLora,
                model: modelId,
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
