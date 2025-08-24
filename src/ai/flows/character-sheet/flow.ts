
'use server';

/**
 * @fileOverview Character sheet generation AI agent.
 * This flow generates a structured character sheet from a simple description.
 * It now uses a Markov chain to generate a sequence of life events, which then
 * guides the AI in crafting a more structured and compelling biography.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
  GenerateCharacterSheetInputSchema, 
  GenerateCharacterSheetOutputSchema, 
  type GenerateCharacterSheetInput, 
  type GenerateCharacterSheetOutput,
} from './types';
import type { Character } from '@/types/character';

// #region Markov Chain Implementation for Life Events

type LifeEventState = 
    | 'Humble Beginnings' 
    | 'Tragic Event' 
    | 'Noble Birth'
    | 'Intense Training' 
    | 'Great Victory' 
    | 'Devastating Loss' 
    | 'Discovery of Power' 
    | 'Betrayal'
    | 'Redemption'
    | 'New Purpose';

const lifeEventTransitions: Record<LifeEventState, Partial<Record<LifeEventState, number>>> = {
    'Humble Beginnings': { 'Intense Training': 0.4, 'Discovery of Power': 0.4, 'Tragic Event': 0.2 },
    'Noble Birth': { 'Intense Training': 0.6, 'Betrayal': 0.3, 'Tragic Event': 0.1 },
    'Tragic Event': { 'Intense Training': 0.5, 'Devastating Loss': 0.3, 'New Purpose': 0.2 },
    'Intense Training': { 'Great Victory': 0.7, 'Devastating Loss': 0.3 },
    'Discovery of Power': { 'Intense Training': 0.6, 'Great Victory': 0.4 },
    'Great Victory': { 'Noble Birth': 0.1, 'Devastating Loss': 0.4, 'New Purpose': 0.3, 'Betrayal': 0.2 },
    'Devastating Loss': { 'Redemption': 0.5, 'New Purpose': 0.5 },
    'Betrayal': { 'Devastating Loss': 0.6, 'Redemption': 0.4 },
    'Redemption': { 'New Purpose': 0.7, 'Great Victory': 0.3 },
    'New Purpose': { 'Intense Training': 0.5, 'Great Victory': 0.5 },
};

function getNextState(currentState: LifeEventState): LifeEventState {
    const transitions = lifeEventTransitions[currentState];
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const state in transitions) {
        cumulativeProbability += transitions[state as LifeEventState]!;
        if (rand < cumulativeProbability) {
            return state as LifeEventState;
        }
    }
    // Fallback to a random start if something goes wrong
    return ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
}

function generateLifePath(length: number = 5): LifeEventState[] {
    const path: LifeEventState[] = [];
    let currentState: LifeEventState = ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
    path.push(currentState);
    
    for (let i = 1; i < length; i++) {
        currentState = getNextState(currentState);
        path.push(currentState);
    }
    return path;
}

// #endregion


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
    
    // Generate the life path using the Markov Chain
    const lifePath = generateLifePath(5);
    const lifePathString = lifePath.join(' -> ');
    
    const prompt = `You are a professional writer and game master specializing in creating rich character details. Your task is to generate a complete character sheet from a user's description and a predefined narrative structure.

    **Core Character Concept:**
    """
    ${description}
    """
    
    **Narrative Skeleton (Life Path):**
    This is the required sequence of events for the character's story. You MUST write a biography that follows this structure.
    ${lifePathString}

    **Instructions for each field:**
    - name: A fitting and creative name for the character, consistent with the concept.
    - archetype: Based on the description, determine the character's class, role, or archetype (e.g., "Grizzled Detective", "Cyber-Sorcerer", "Starship Captain"). This is a critical field.
    - equipment: A list of 3-5 key items, weapons, or gear the character possesses.
    - physicalDescription: A detailed, one-paragraph description focusing only on the character's visual appearance, clothing, and gear. This will be used for an image generation prompt, so be descriptive and evocative.
    - biography: A detailed, multi-paragraph biography exploring the character's backstory, personality, and motivations. **CRITICAL: You MUST craft the biography to logically follow the narrative skeleton provided above.** Each event in the skeleton should be a key point in the character's story.
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}. All other fields should also be translated.` : 'All fields MUST be written in English.'}
    `;
    
    let aiOutput: z.infer<typeof GenerateCharacterSheetOutputSchema>;

    if (engineId === 'openrouter') {
        const systemApiKey = process.env.OPENROUTER_API_KEY;
        const apiKey = userApiKey || systemApiKey;

        if (!apiKey) {
            throw new Error("OpenRouter API key is not configured on the server or provided by the user in their profile settings.");
        }
        
        const { output } = await ai.generate({
            model: modelId,
            prompt: prompt,
            output: {
                schema: GenerateCharacterSheetOutputSchema,
                format: 'json',
            },
            config: {
                apiKey: apiKey,
                provider: 'openai',
                 extraHeaders: {
                    'HTTP-Referer': 'https://charaforge.com',
                    'X-Title': 'CharaForge',
                },
            },
        });
        
         if (!output) {
            throw new Error('AI failed to generate a character sheet via OpenRouter.');
        }
        aiOutput = output;

    } else {
        // Default to Gemini engine
        const finalModelId = 'googleai/gemini-1.5-flash-latest';
        const { output } = await ai.generate({
            model: finalModelId,
            prompt: prompt,
            output: {
                schema: GenerateCharacterSheetOutputSchema,
            },
        });
        if (!output) {
          throw new Error('AI failed to generate a character sheet.');
        }
        aiOutput = output;
    }
    
    return aiOutput;
  }
);
