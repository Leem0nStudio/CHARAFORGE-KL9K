
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

/**
 * Queries a custom endpoint for image generation.
 * This allows users to use their own Stable Diffusion instances or other custom services.
 * @param {object} data The payload including inputs, endpoint URL, and optional API key.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryCustomEndpointAPI(data: { 
    inputs: string, 
    endpointUrl: string, 
    userApiKey?: string,
    aspectRatio?: string 
}): Promise<string> {
    const { inputs, endpointUrl, userApiKey, aspectRatio } = data;
    
    try {
        // Import custom endpoint configuration
        const { getCustomEndpoint } = await import('@/lib/custom-endpoints');
        
        // Try to find a matching custom endpoint configuration
        const endpointConfig = getCustomEndpoint(endpointUrl) || 
                              Object.values(await import('@/lib/custom-endpoints')).find(
                                  config => config.url === endpointUrl
                              );
        
        // Use configuration if available, otherwise use defaults
        const settings = endpointConfig?.defaultSettings || {
            numInferenceSteps: 20,
            guidanceScale: 7.5,
            negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy",
        };
        
        // Prepare the payload for Stable Diffusion
        const payload = {
            prompt: inputs,
            negative_prompt: settings.negativePrompt,
            num_inference_steps: settings.numInferenceSteps,
            guidance_scale: settings.guidanceScale,
            width: aspectRatio === '16:9' ? 1344 : aspectRatio === '9:16' ? 768 : 1024,
            height: aspectRatio === '16:9' ? 768 : aspectRatio === '9:16' ? 1344 : 1024,
            // Additional Stable Diffusion parameters
            sampler_name: "DPM++ 2M Karras", // Common sampler for good quality
            cfg_scale: settings.guidanceScale,
            restore_faces: true, // Better face generation
            tiling: false, // Disable tiling for character images
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add API key if provided
        if (userApiKey) {
            headers['Authorization'] = `Bearer ${userApiKey}`;
        }

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Custom Endpoint API Error (${response.status}):`, errorBody);
            
            if (response.status === 401) {
                throw new Error('Authentication failed. Please check your API key.');
            }
            if (response.status === 404) {
                throw new Error('Custom endpoint not found. Please check the URL.');
            }
            if (response.status === 503) {
                throw new Error('Custom endpoint is currently unavailable. Please try again later.');
            }
            
            throw new Error(`Custom endpoint request failed with status ${response.status}.`);
        }

        // Handle different response formats
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // JSON response (common for some Stable Diffusion APIs)
            const jsonResponse = await response.json();
            
            if (jsonResponse.image) {
                // Base64 encoded image
                return `data:image/png;base64,${jsonResponse.image}`;
            } else if (jsonResponse.images && jsonResponse.images.length > 0) {
                // Array of base64 images
                return `data:image/png;base64,${jsonResponse.images[0]}`;
            } else if (jsonResponse.data && jsonResponse.data.length > 0) {
                // Alternative format for some APIs
                const imageData = jsonResponse.data[0];
                if (typeof imageData === 'string') {
                    return `data:image/png;base64,${imageData}`;
                }
            } else {
                throw new Error('Custom endpoint returned JSON but no image data found.');
            }
        } else {
            // Binary image response
            const imageBlob = await response.blob();
            if (!imageBlob.type.startsWith('image/')) {
                throw new Error('Custom endpoint did not return a valid image file.');
            }

            const arrayBuffer = await imageBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = buffer.toString('base64');
            const mimeType = imageBlob.type;
            
            return `data:${mimeType};base64,${base64Image}`;
        }

    } catch (error) {
        console.error("Custom Endpoint API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to generate image via custom endpoint. Error: ${message}`);
    }
}

/**
 * Queries Google Vertex AI Model Garden for image generation.
 * This allows users to use Google Cloud's managed Stable Diffusion models.
 * @param {object} data The payload including inputs, endpoint ID, and optional LoRA configuration.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryVertexAIAPI(data: { 
    inputs: string, 
    endpointId: string, 
    aspectRatio?: string,
    lora?: any
}): Promise<string> {
    const { inputs, endpointId, aspectRatio, lora } = data;
    
    try {
        // Import Vertex AI configuration
        const { getVertexAIModelByEndpointId, getDefaultVertexAILocation } = await import('@/lib/vertex-ai-config');
        
        // Get project ID from service account
        let projectId: string | undefined;
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                projectId = serviceAccount.project_id;
            }
        } catch (e) {
            throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY to get Project ID.");
        }

        if (!projectId) {
            throw new Error("Could not determine Google Cloud Project ID from server environment.");
        }

        // Try to find a matching Vertex AI model configuration
        const modelConfig = getVertexAIModelByEndpointId(endpointId);
        const location = modelConfig?.location || getDefaultVertexAILocation();
        
        const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;

        // Use configuration if available, otherwise use defaults
        const settings = modelConfig?.defaultSettings || {
            guidanceScale: 7.5,
            numInferenceSteps: 20,
            sampleCount: 1,
        };

        // Prepare the payload for Vertex AI
        const payload: any = {
            instances: [
                { 
                    "text": inputs,
                    // Add LoRA configuration if provided
                    ...(lora?.vertexAiAlias && { "lora": lora.vertexAiAlias })
                }
            ],
            parameters: {
                "width": aspectRatio === '16:9' ? 1344 : aspectRatio === '9:16' ? 768 : 1024,
                "height": aspectRatio === '16:9' ? 768 : aspectRatio === '9:16' ? 1344 : 1024,
                "sampleCount": settings.sampleCount,
                "guidanceScale": settings.guidanceScale,
                "numInferenceSteps": settings.numInferenceSteps,
            }
        };

        // Import Google Auth library
        const { GoogleAuth } = await import('google-auth-library');
        
        // Authenticate using service account
        const auth = new GoogleAuth({
            credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!),
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
        
        const client = await auth.getClient();
        
        const response = await client.request({
            url: endpointUrl,
            method: 'POST',
            data: payload,
        });

        const responseData = response.data as any;
        const prediction = responseData?.predictions?.[0];
        
        if (prediction?.bytesBase64Encoded) {
            return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
        } else if (prediction?.image) {
            // Alternative response format
            return `data:image/png;base64,${prediction.image}`;
        } else {
            console.error("Vertex AI response did not contain an image:", JSON.stringify(responseData, null, 2));
            throw new Error("The Vertex AI model responded, but did not return a valid image.");
        }

    } catch (error: any) {
        console.error("Vertex AI API Error:", error);
        
        // Provide user-friendly error messages
        if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please check your Google Cloud service account configuration.');
        }
        if (error.response?.status === 404) {
            throw new Error('Vertex AI endpoint not found. Please check the endpoint ID.');
        }
        if (error.response?.status === 503) {
            throw new Error('Vertex AI endpoint is currently unavailable. Please try again later.');
        }
        
        const errorMessage = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
        throw new Error(`Failed to generate image via Vertex AI. Error: ${errorMessage}`);
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
    const { engineId, modelId, aspectRatio, userApiKey, lora, customEndpointUrl, customApiKey } = engineConfig;
    
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
    } else if (engineId === 'vertexai') {
        try {
            if (!modelId) {
                throw new Error("Vertex AI endpoint ID is required for this engine.");
            }

            // Append LoRA trigger words to the prompt if applicable
            let finalDescription = description;
            if (lora?.triggerWords && lora.triggerWords.length > 0) {
                 finalDescription = `${lora.triggerWords.join(', ')}, ${description}`;
            }

            imageUrl = await queryVertexAIAPI({ 
                inputs: finalDescription,
                endpointId: modelId,
                aspectRatio: aspectRatio,
                lora: lora,
            });

        } catch (error) {
            console.error("Error in Vertex AI flow:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            throw new Error(message);
        }
    } else if (engineId === 'custom') {
        try {
            if (!customEndpointUrl) {
                throw new Error("Custom endpoint URL is required for custom engine.");
            }

            // Append LoRA trigger words to the prompt if applicable
            let finalDescription = description;
            if (lora?.triggerWords && lora.triggerWords.length > 0) {
                 finalDescription = `${lora.triggerWords.join(', ')}, ${description}`;
            }

            imageUrl = await queryCustomEndpointAPI({ 
                inputs: finalDescription,
                endpointUrl: customEndpointUrl,
                userApiKey: customApiKey || userApiKey,
                aspectRatio: aspectRatio,
            });

        } catch (error) {
            console.error("Error in Custom Endpoint flow:", error);
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

    