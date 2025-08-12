
'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description.
 * This flow is now more flexible, supporting dynamic model and LoRA selection.
 */

import { ai } from '@/ai/genkit';
import { GenerateCharacterImageInputSchema, GenerateCharacterImageOutputSchema, type GenerateCharacterImageInput, type GenerateCharacterImageOutput } from './types';

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
 * @param {object} data The payload to send to the model, including the prompt and model ID.
 * @returns {Promise<string>} A promise that resolves to the image as a Data URI.
 */
async function queryHuggingFaceInferenceAPI(data: { inputs: string, model: string }): Promise<string> {
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
    if (!HUGGING_FACE_API_KEY) {
        throw new Error("Hugging Face API key is not configured on the server.");
    }
    
    // The API URL MUST use the base model ID, not the LoRA's ID.
    const API_URL = `https://api-inference.huggingface.co/models/${data.model}`;
    
    const response = await fetch(API_URL, {
        headers: {
            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
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
    const { 
        description, 
        aspectRatio, 
        imageEngine, 
        hfModelId,
        lora,
        loraWeight, 
        triggerWords 
    } = input;

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
        try {
            if (!hfModelId) {
                throw new Error("Hugging Face model ID is required for this engine.");
            }

            let promptWithLora = description;
            // Correctly append LoRA information to the prompt, not the model URL.
            if (lora) {
                const weight = loraWeight || 0.75;
                const words = triggerWords ? `${triggerWords}, ` : '';
                // The syntax for HF inference API might just be adding words and concepts.
                // The <lora:> syntax is specific to some UIs like A1111.
                // For HF API, we rely on the trigger words and the description.
                promptWithLora = `${words}${description}`;
            }

            const imageUrl = await queryHuggingFaceInferenceAPI({ 
                inputs: promptWithLora,
                model: hfModelId, // Always use the base model ID here.
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
