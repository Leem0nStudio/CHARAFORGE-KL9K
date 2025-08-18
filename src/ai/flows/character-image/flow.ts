
'use server';

/**
 * @fileOverview An AI agent for generating character images.
 * This flow is now fully data-driven by the engineConfig object and uses the HF Inference API.
 */
import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';
import type { GenerationCommonOptions } from 'genkit/ai';


// Helper function to get image dimensions in pixels.
function getDimensions(aspectRatio: '1:1' | '16:9' | '9:16' | undefined) {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1344, height: 768 }; // Common 16:9 for SDXL
    case '9:16':
      return { width: 768, height: 1344 };
    case '1:1':
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Queries the Hugging Face Inference API directly.
 * This is more robust than relying on Gradio spaces.
 * @param {object} data The payload including inputs, model HF ID, and optional user API key.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryHuggingFaceInferenceAPI(data: { inputs: string, modelId: string, userApiKey?: string }): Promise<string> {
    const systemApiKey = process.env.HUGGING_FACE_API_KEY;
    const apiKey = data.userApiKey || systemApiKey;

    if (!apiKey) {
        throw new Error("Hugging Face API key is not configured on the server or provided by the user in their profile settings.");
    }

    const inferenceApiUrl = `https://api-inference.huggingface.co/models/${data.modelId}`;
    
    try {
        const response = await fetch(inferenceApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: data.inputs,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Hugging Face Inference API Error (${response.status}):`, errorBody);
            // Provide a more user-friendly error message
            if (response.status === 404) {
                 throw new Error(`Model not found at the Hugging Face Inference API. Ensure '${data.modelId}' is a valid text-to-image model.`);
            }
            if (response.status === 503) {
                 throw new Error(`The model '${data.modelId}' is currently loading on Hugging Face. Please try again in a few moments.`);
            }
            throw new Error(`Hugging Face Inference API request failed with status ${response.status}.`);
        }

        // The API returns the image as binary data (blob)
        const imageBlob = await response.blob();
        if (!imageBlob.type.startsWith('image/')) {
            throw new Error('The Hugging Face API did not return a valid image file.');
        }

        // Convert the blob to a Buffer, then to a Base64 string to create the Data URI
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = imageBlob.type;
        
        return `data:${'\'\''}${mimeType};base64,${base64Image}`;

    } catch (error) {
        console.error("Hugging Face Inference API Error:", error);
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
    const { engineId, modelId, aspectRatio, userApiKey, lora } = engineConfig;
    
    let imageUrl: string | undefined;

    if (engineId === 'gemini') {
        // Standard Gemini image generation
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
            imageUrl = media?.url;
        } catch (error) {
            console.error(`Error generating image with Gemini:`, error);
            const message = error instanceof Error ? error.message : `An unknown error occurred with the Gemini engine.`;
            throw new Error(`Failed to generate character image via Gemini. ${message}`);
        }
    } else if (engineId === 'vertexai') {
        try {
            if (!modelId) {
                throw new Error("Vertex AI Endpoint ID is required for this engine.");
            }
            const { width, height } = getDimensions(aspectRatio);

            // **DEFINITIVE FIX**: Construct the exact JSON payload the Vertex AI endpoint expects,
            // as shown in the user's screenshot.
            const vertexParameters: Record<string, any> = {
                width,
                height,
                num_inference_steps: 25, // A sensible default
                guidance_scale: 7.5,    // A sensible default
            };

            if (lora?.id) {
                // The screenshot shows 'lora_id' as the parameter name.
                vertexParameters.lora_id = lora.id;
                // It's possible a weight parameter is also needed, e.g., 'lora_weight'.
                // If the user's endpoint supports it, it would be added here.
                // For now, we only add the ID as seen in the screenshot.
            }
            
            // For Vertex AI endpoints, the 'prompt' is actually passed inside the 'instances' array.
            // We use a custom config to build this structure.
            const customPayload = {
              endpointId: modelId,
              instances: [
                { text: description }
              ],
              parameters: vertexParameters,
            };

            const { media } = await ai.generate({
                model: 'googleai/gemini-1.0-pro', // Use a base model to route the request
                prompt: '', // The prompt is inside the custom config, so this can be empty
                config: {
                    // This custom structure is passed directly to the Vertex AI endpoint.
                    custom: customPayload,
                },
            });

            imageUrl = media?.url;

        } catch (error) {
            console.error(`Error generating image with Vertex AI:`, error);
            const message = error instanceof Error ? error.message : `An unknown error occurred with the Vertex AI engine.`;
            throw new Error(`Failed to generate character image via Vertex AI. ${message}`);
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
    } else if (engineId === 'openrouter') {
        try {
            if (!modelId) {
                throw new Error("OpenRouter model ID is required for this engine.");
            }
            const systemApiKey = process.env.OPENROUTER_API_KEY;
            const apiKey = userApiKey || systemApiKey;

            if (!apiKey) {
                throw new Error("OpenRouter API key is not configured on the server or provided by the user in their profile settings.");
            }

            const { media } = await ai.generate({
                model: modelId,
                prompt: description,
                config: {
                    apiKey: apiKey,
                    provider: 'openai',
                    size: "1024x1024",
                    response_format: 'b64_json',
                    extraHeaders: {
                        'HTTP-Referer': 'https://charaforge.com',
                        'X-Title': 'CharaForge',
                    }
                }
            });
            
            if (media?.url) {
                // The URL is already a data URI in b64_json format when using this method
                imageUrl = media.url;
            } else {
                 throw new Error("Received an unexpected response format from the OpenRouter API.");
            }

        } catch (error) {
            console.error("Error in OpenRouter flow:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(`Failed to generate image via OpenRouter. Error: ${message}`);
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
