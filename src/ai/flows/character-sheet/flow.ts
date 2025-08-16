
'use server';

/**
 * @fileOverview Character sheet generation AI agent.
 * This flow generates a structured character sheet from a simple description.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
  GenerateCharacterSheetInputSchema, 
  GenerateCharacterSheetOutputSchema, 
  type GenerateCharacterSheetInput, 
  type GenerateCharacterSheetOutput 
} from './types';

/**
 * Queries the OpenRouter API for text generation.
 * @param {object} data The payload including prompt, model ID, and optional user API key.
 * @returns {Promise<GenerateCharacterSheetOutput>} A promise that resolves to the parsed AI output.
 */
async function queryOpenRouterTextAPI(data: { prompt: string, modelId: string, userApiKey?: string }): Promise<GenerateCharacterSheetOutput> {
    const systemApiKey = process.env.OPENROUTER_API_KEY;
    const apiKey = data.userApiKey || systemApiKey;

    if (!apiKey) {
        throw new Error("OpenRouter API key is not configured on the server or provided by the user in their profile settings.");
    }
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://charaforge.com',
                'X-Title': 'CharaForge',
            },
            body: JSON.stringify({
                model: data.modelId,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: "You are an AI assistant that generates character sheets. Respond with a valid JSON object based on the user's prompt, conforming to the provided schema." },
                    { role: "user", content: data.prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        
        if (result.choices && result.choices[0]?.message?.content) {
            const content = JSON.parse(result.choices[0].message.content);
            // Validate the received JSON against our Zod schema
            const validation = GenerateCharacterSheetOutputSchema.safeParse(content);
            if (!validation.success) {
                console.error("OpenRouter response failed Zod validation:", validation.error);
                throw new Error("Received an unexpected response format from the OpenRouter API.");
            }
            return validation.data;
        }
        
        throw new Error("Received an unexpected response structure from the OpenRouter API.");

    } catch (error) {
        console.error("OpenRouter API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to generate character sheet via OpenRouter. Error: ${message}`);
    }
}


export async function generateCharacterSheet(input: GenerateCharacterSheetInput): Promise<GenerateCharacterSheetOutput> {
  return generateCharacterSheetFlow(input);
}


const generateCharacterSheetFlow = ai.defineFlow(
  {
    name: 'generateCharacterSheetFlow',
    inputSchema: GenerateCharacterSheetInputSchema,
    outputSchema: GenerateCharacterSheetOutputSchema,
  },
  async (input) => {
    const { description, targetLanguage, engineConfig } = input;
    const { engineId, modelId, userApiKey } = engineConfig;
    
    const prompt = `You are a professional writer and game master specializing in creating rich character details. Your task is to generate a complete character sheet from a user's description.

    Based on the provided description, generate all the required fields.
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}. All other fields should also be translated.` : 'All fields MUST be written in English.'}

    Description: """
    ${description}
    """
    
    Instructions for each field:
    - name: A fitting and creative name for the character.
    - archetype: A one or two-word class, role, or archetype (e.g., "Grizzled Detective", "Cyber-Sorcerer", "Starship Captain").
    - equipment: A list of 3-5 key items, weapons, or gear the character possesses.
    - physicalDescription: A detailed, one-paragraph description focusing only on the character's visual appearance, clothing, and gear. This will be used for an image generation prompt, so be descriptive and evocative.
    - biography: A detailed, multi-paragraph biography exploring the character's backstory, personality, and motivations. Make it engaging and narrative-driven.
    `;

    if (engineId === 'openrouter') {
        return await queryOpenRouterTextAPI({
            prompt: prompt,
            modelId: modelId,
            userApiKey: userApiKey,
        });
    }

    // Default to Gemini engine
    const { output } = await ai.generate({
        model: modelId,
        prompt: prompt,
        output: {
            schema: GenerateCharacterSheetOutputSchema,
        },
    });
    
    if (!output) {
      throw new Error('AI failed to generate a character sheet.');
    }

    return output;
  }
);
