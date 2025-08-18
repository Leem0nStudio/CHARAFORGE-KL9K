
'use server';

/**
 * @fileOverview An AI agent for generating character images.
 * This flow is now fully data-driven by the engineConfig object and uses the HF Inference API.
 */
import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';
import type { GenerationCommonOptions } from 'genkit/ai';
import { googleAI } from '@genkit-ai/googleai';


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
        
        return `data:${mimeType};base64,${base64Image}`;

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
        if (!modelId) {
            throw new Error("Vertex AI Endpoint ID (as modelId) is required for this engine.");
        }
        
        const { width, height } = getDimensions(aspectRatio);
        
        // **CRITICAL FIX**: Construct the exact payload Vertex AI expects for SDXL.
        // The payload must have an 'instances' array and a 'parameters' object.
        const payload = {
            instances: [
                { text: description }
            ],
            parameters: {
                width: width,
                height: height,
                // Add other parameters your model might accept here
                sampleCount: 1, 
            } as Record<string, any>
        };

        if (lora && lora.id) {
            // Add LoRA parameters if provided, as expected by the model.
            payload.parameters.lora_id = lora.id;
            if (lora.weight) {
                payload.parameters.lora_weight_alpha = lora.weight;
            }
        }

        try {
            const { output } = await ai.generate({
                 // Use a generic model placeholder for the call, as the endpointId in custom will be used.
                model: googleAI.model('gemini-1.0-pro'),
                prompt: description, // Keep a prompt for Genkit validation, but the payload structure is what matters.
                config: {
                    // This is the correct way to specify a custom endpoint and payload structure.
                    endpointId: modelId,
                    custom: payload,
                },
            });
            
            // The result from a custom Vertex endpoint might be structured differently.
            // We need to parse the base64 image data from the response.
            const prediction = output as any;
            if (prediction?.predictions?.[0]?.bytesBase64Encoded) {
                const base64Image = prediction.predictions[0].bytesBase64Encoded;
                imageUrl = `data:image/png;base64,${base64Image}`;
            } else {
                 console.error("Vertex AI response did not contain expected image data:", prediction);
                 throw new Error("Received an unexpected response format from the Vertex AI endpoint.");
            }
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

            // Append LoRA trigger words to the prompt if applicable
            let finalDescription = description;
            if (lora?.triggerWords && lora.triggerWords.length > 0) {
                 finalDescription = `${lora.triggerWords.join(', ')}, ${description}`;
            }

            imageUrl = await queryHuggingFaceInferenceAPI({ 
                inputs: finalDescription,
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
        // Fallback for any other engine ID to avoid breaking the app completely.
        console.warn(`The image generation engine '${engineId}' is not fully supported in this version. Falling back to Gemini.`);
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
            console.error(`Fallback to Gemini failed:`, error);
            throw new Error(`The selected engine '${engineId}' is not available, and the fallback to Gemini also failed.`);
        }
    }

    if (!imageUrl) {
        throw new Error(`The ${engineId} engine failed to return a valid image.`);
    }

    return { imageUrl };
  }
);

    