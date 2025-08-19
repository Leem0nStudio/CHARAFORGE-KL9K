
'use server';

/**
 * @fileOverview An AI agent for generating character images.
 * This flow is now fully data-driven by the engineConfig object and can support a centralized ComfyUI server.
 */
import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';
import type { GenerationCommonOptions } from 'genkit/ai';
import { GoogleAuth } from 'google-auth-library';


/**
 * Queries a ComfyUI server instance.
 * It intelligently finds the main positive prompt node in a workflow and replaces its text.
 * @param {object} data The payload including the prompt, API URL, and workflow.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryComfyUI(data: { apiUrl: string; prompt: string; workflow: object; }): Promise<string> {
    // Deep copy to avoid mutating the original workflow object from the database.
    const workflow = JSON.parse(JSON.stringify(data.workflow)); 
    
    // Heuristic: Find the main positive prompt node. This is a common pattern in ComfyUI workflows.
    let promptNodeId: string | null = null;
    for (const nodeId in workflow) {
        if (workflow[nodeId].class_type === 'CLIPTextEncode' || workflow[nodeId].class_type === 'CLIP Text Encode (Prompt)') {
            promptNodeId = nodeId;
            break;
        }
    }

    if (!promptNodeId) {
        throw new Error("Could not find a 'CLIPTextEncode' node in the ComfyUI workflow. The workflow must have a standard positive prompt input node.");
    }
    
    // Update the prompt text in the identified node.
    workflow[promptNodeId].inputs.text = data.prompt;

    const response = await fetch(data.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("ComfyUI Server Error Response:", errorText);
        throw new Error(`ComfyUI server request failed with status ${response.status}. Please check the server logs.`);
    }

    const result = await response.json();
    const images = result?.output?.images;

    if (!images || images.length === 0 || !images[0].filename) {
        console.error("ComfyUI Server Invalid Response:", JSON.stringify(result, null, 2));
        throw new Error("ComfyUI server did not return any valid image data in its response.");
    }
    
    // The ComfyUI /view endpoint requires the server address. We extract it from the API URL.
    const serverAddress = data.apiUrl.substring(0, data.apiUrl.lastIndexOf('/prompt'));
    const imageUrl = `${serverAddress}/view?filename=${images[0].filename}&subfolder=${images[0].subfolder || ''}&type=${images[0].type || 'output'}`;
    
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error("ComfyUI Image Fetch Error:", errorText);
        throw new Error(`Failed to fetch the generated image from ComfyUI's /view endpoint. Status: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    return `data:image/png;base64,${base64Image}`;
}


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
    
    // Centralized prompt construction
    let finalDescription = description;
    if (lora?.triggerWords && lora.triggerWords.length > 0) {
        finalDescription = `${lora.triggerWords.join(', ')}, ${description}`;
        console.log(`Using LoRA. Appended trigger words. New prompt: ${finalDescription}`);
    }


    if (engineId === 'gemini') {
        // Standard Gemini image generation
        try {
            const { width, height } = getDimensions(aspectRatio);
            const { media } = await ai.generate({
                model: 'googleai/gemini-2.0-flash-preview-image-generation',
                prompt: finalDescription,
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
    } else if (engineId === 'comfyui') {
        if (!engineConfig.apiUrl || !engineConfig.comfyWorkflow) {
             throw new Error("ComfyUI engine requires an API URL and a workflow JSON.");
        }
        imageUrl = await queryComfyUI({
            apiUrl: engineConfig.apiUrl,
            prompt: finalDescription,
            workflow: engineConfig.comfyWorkflow,
        });

    } else if (engineId === 'vertexai' && modelId) {
        let projectId: string | undefined;
        let serviceAccount: any;

        try {
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountKey) {
                throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
            }
            serviceAccount = JSON.parse(serviceAccountKey);
            projectId = serviceAccount.project_id;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Unknown error';
            throw new Error(`Failed to parse service account key. Error: ${errorMsg}`);
        }
        
        if (!projectId) {
            throw new Error("Could not determine Google Cloud Project ID from server environment.");
        }

        const location = 'us-central1';
        // The `modelId` in this case is the Vertex AI Endpoint ID
        const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${modelId}:predict`;

        const { width, height } = getDimensions(aspectRatio);
        const payload: any = {
          "instances": [
              { "prompt": finalDescription }
          ],
          "parameters": {
              "width": width,
              "height": height
          }
        };
        
        try {
            const auth = new GoogleAuth({
                credentials: serviceAccount,
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
                imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
            } else {
                console.error("Vertex AI response did not contain an image:", JSON.stringify(responseData, null, 2));
                throw new Error("The model endpoint responded, but did not return a valid image.");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
            console.error("Error calling Vertex AI endpoint:", JSON.stringify(error.response?.data, null, 2));
            throw new Error(`Failed to get prediction from Vertex AI: ${errorMessage}`);
        }
    } else if (engineId === 'huggingface') {
        try {
            if (!modelId) {
                throw new Error("Hugging Face model ID is required for this engine.");
            }

            // The trigger words are already prepended to finalDescription
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
                prompt: finalDescription,
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
        throw new Error(`The image generation engine '${engineId}' is not supported.`);
    }

    if (!imageUrl) {
        throw new Error(`The ${engineId} engine failed to return a valid image.`);
    }

    return { imageUrl };
  }
);

    
