
'use server';

/**
 * @fileOverview Character sheet generation AI agent.
 * This flow generates a structured character sheet from a simple description.
 * It now uses Markov chains for both generating a sequence of life events to guide
 * the biography, and for generating a thematically appropriate character name.
 * It also includes a retry mechanism for handling transient API errors.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
  GenerateCharacterSheetInputSchema, 
  GenerateCharacterSheetOutputSchema, 
  type GenerateCharacterSheetInput, 
  type GenerateCharacterSheetOutput,
} from './types';

// #region Markov Chain Implementation for Life Events

export type LifeEventState = 
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

// This is now private to this module to satisfy 'use server' constraints.
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

// Exported for reuse in other server actions
export async function getNextLifeState(currentState: LifeEventState): Promise<LifeEventState> {
    const transitions = lifeEventTransitions[currentState];
    if (!transitions) {
        // Fallback for safety, though every state should be defined.
        return ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
    }
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const state in transitions) {
        cumulativeProbability += transitions[state as LifeEventState]!;
        if (rand < cumulativeProbability) {
            return state as LifeEventState;
        }
    }
    // Fallback to a random starting state if no transition is chosen
    return ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
}

// Internal synchronous version for use within this file
function getNextLifeState_internal(currentState: LifeEventState): LifeEventState {
    const transitions = lifeEventTransitions[currentState];
    if (!transitions) {
        // Fallback for safety
        return ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
    }
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const state in transitions) {
        cumulativeProbability += transitions[state as LifeEventState]!;
        if (rand < cumulativeProbability) {
            return state as LifeEventState;
        }
    }
    return ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
}

function generateLifePath(length: number = 5): LifeEventState[] {
    const path: LifeEventState[] = [];
    let currentState: LifeEventState = ['Humble Beginnings', 'Noble Birth', 'Tragic Event'][Math.floor(Math.random() * 3)] as LifeEventState;
    path.push(currentState);
    
    for (let i = 1; i < length; i++) {
        currentState = getNextLifeState_internal(currentState);
        path.push(currentState);
    }
    return path;
}


// #endregion

// #region Markov Chain Implementation for Name Generation

const nameExamples: Record<string, string[]> = {
    'fantasy': ['Arion', 'Elara', 'Fenris', 'Lirael', 'Kael', 'Seraphina', 'Draven', 'Isolde'],
    'sci-fi': ['Jax', 'Cyra', 'Orion', 'Nova', 'Roric', 'Vesper', 'Kaelen', 'Xyla'],
    'cyberpunk': ['Kain', 'Jynx', 'Raze', 'Nyx', 'Cortex', 'Echo', 'Wraith', 'Hex'],
    'horror': ['Silas', 'Lilith', 'Malachi', 'Ravenna', 'Abaddon', 'Morwen', 'Cain', 'Seraphine'],
    'default': ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Jamie', 'Peyton'],
};

function buildNameChain(theme: string): Record<string, string[]> {
    const chain: Record<string, string[]> = { '_start': [] };
    const names = nameExamples[theme] || nameExamples.default;

    names.forEach(name => {
        chain['_start'].push(name[0]);
        for (let i = 0; i < name.length - 1; i++) {
            const char = name[i];
            if (!chain[char]) {
                chain[char] = [];
            }
            chain[char].push(name[i+1]);
        }
    });
    return chain;
}

function generateName(chain: Record<string, string[]>, minLength: number, maxLength: number): string {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let name = chain['_start'][Math.floor(Math.random() * chain['_start'].length)];
    
    while (name.length < length) {
        const lastChar = name[name.length - 1];
        const nextChars = chain[lastChar];
        if (!nextChars) break; 
        const nextChar = nextChars[Math.floor(Math.random() * nextChars.length)];
        name += nextChar;
    }
    return name;
}

function getThemeFromArchetype(archetype: string): string {
    const lowerArchetype = archetype.toLowerCase();
    if (lowerArchetype.includes('cyber') || lowerArchetype.includes('netrunner')) return 'cyberpunk';
    if (lowerArchetype.includes('space') || lowerArchetype.includes('starship')) return 'sci-fi';
    if (lowerArchetype.includes('vampire') || lowerArchetype.includes('investigator')) return 'horror';
    if (lowerArchetype.includes('knight') || lowerArchetype.includes('sorcerer') || lowerArchetype.includes('elf')) return 'fantasy';
    return 'default';
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
    
    const lifePath = generateLifePath(5);
    const lifePathString = lifePath.join(' -> ');

    // Use AI to determine archetype first, then generate name based on it.
    const archetypePrompt = `Based on the following description, what is a single, concise character archetype, class, or role? (e.g., "Grizzled Detective", "Cyber-Sorcerer", "Starship Captain"). Description: "${description}"`;
    const archetypeResponse = await ai.generate({ model: 'googleai/gemini-1.5-flash-latest', prompt: archetypePrompt });
    const archetype = archetypeResponse.text.trim().replace(/"/g, '');

    const nameTheme = getThemeFromArchetype(archetype);
    const nameChain = buildNameChain(nameTheme);
    const characterName = generateName(nameChain, 4, 8);
    
    const prompt = `You are a professional writer and game master. Your task is to generate a character sheet from a user's description, a predefined name, archetype, and narrative structure.

    **Core Character Concept:**
    """
    ${description}
    """
    
    **Pre-defined Information (You MUST use these):**
    - Name: ${characterName}
    - Archetype: ${archetype}
    
    **Narrative Skeleton (Life Path):**
    This is the required sequence of events for the character's story. You MUST write a biography that follows this structure.
    ${lifePathString}

    **Instructions for remaining fields:**
    - equipment: A list of 3-5 key items, weapons, or gear the character possesses, consistent with their archetype.
    - physicalDescription: A detailed, one-paragraph description of the character's visual appearance, clothing, and gear. This will be used for an image generation prompt, so be descriptive and evocative.
    - biography: A detailed, multi-paragraph biography exploring the character's backstory, personality, and motivations. **CRITICAL: You MUST craft the biography to logically follow the narrative skeleton provided above.** Each event in the skeleton should be a key point in the character's story.
    - birthYear: A creative and thematically appropriate birth year, era, or age for the character (e.g., "Year of the Twin Comets", "Age 35", "9th Cycle of the Neon Era").
    - weaknesses: A short, comma-separated string of 2-3 thematic weaknesses or vices (e.g., "Avarice, Fear of heights, Overconfidence").
    
    ${targetLanguage ? `IMPORTANT: The biography MUST be written in ${targetLanguage}. All other fields should also be translated.` : 'All fields MUST be written in English.'}
    `;
    
    let aiOutput: z.infer<typeof GenerateCharacterSheetOutputSchema>;
    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
        try {
            if (engineId === 'openrouter') {
                const systemApiKey = process.env.OPENROUTER_API_KEY;
                const apiKey = userApiKey || systemApiKey;
                if (!apiKey) {
                    throw new Error("OpenRouter API key is not configured on the server or provided by the user.");
                }
                const { output } = await ai.generate({
                    model: modelId,
                    prompt: prompt,
                    output: { schema: GenerateCharacterSheetOutputSchema, format: 'json' },
                    config: { apiKey, provider: 'openai', extraHeaders: { 'HTTP-Referer': 'https://charaforge.com', 'X-Title': 'CharaForge' } },
                });
                if (!output) throw new Error('AI failed to generate a character sheet via OpenRouter.');
                aiOutput = output;
            } else {
                const finalModelId = 'googleai/gemini-1.5-flash-latest';
                const { output } = await ai.generate({
                    model: finalModelId,
                    prompt: prompt,
                    output: { schema: GenerateCharacterSheetOutputSchema },
                });
                if (!output) throw new Error('AI failed to generate a character sheet.');
                aiOutput = output;
            }

            aiOutput.name = characterName;
            aiOutput.archetype = archetype;
            return aiOutput;

        } catch (error: unknown) {
            attempts++;
            const errorMessage = (error as Error).message || 'An unknown error occurred.';
            if (errorMessage.includes('503') && attempts < MAX_RETRIES) {
                console.warn(`Attempt ${attempts} failed due to model overload. Retrying in ${attempts * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, attempts * 1000)); // Exponential backoff
            } else {
                 if (errorMessage.includes('503')) {
                    throw new Error("The AI model is currently experiencing high traffic. Please try again in a few moments.");
                }
                throw error; // Re-throw other errors immediately
            }
        }
    }
    
    // This line will only be reached if all retries fail
    throw new Error("The AI model is currently overloaded. Please try again later after all retry attempts.");
  }
);
