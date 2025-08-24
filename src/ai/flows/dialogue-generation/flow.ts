
'use server';

/**
 * @fileOverview An AI agent for generating characteristic dialogue lines for a character.
 * This flow uses a two-step process:
 * 1. An LLM call to determine the character's core personality from their bio.
 * 2. A Markov chain, selected based on the personality, to generate a sequence of dialogue types.
 * 3. A final LLM call to flesh out the dialogue types into actual spoken lines.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateDialogueInputSchema, GenerateDialogueOutputSchema, type GenerateDialogueInput, type GenerateDialogueOutput } from './types';

// #region Markov Chain Implementation for Dialogue
type DialogueState = 'Greeting' | 'Question' | 'Statement' | 'Complaint' | 'Boast' | 'Threat' | 'Joke' | 'Farewell';
type PersonalityType = 'Grumpy' | 'Noble' | 'Sarcastic' | 'Cheerful' | 'Scholarly';

const dialogueTransitions: Record<PersonalityType, Partial<Record<DialogueState, Partial<Record<DialogueState, number>>>>> = {
    'Grumpy': {
        'Greeting': { 'Complaint': 0.6, 'Question': 0.3, 'Statement': 0.1 },
        'Statement': { 'Complaint': 0.7, 'Farewell': 0.3 },
        'Question': { 'Complaint': 0.5, 'Statement': 0.5 },
        'Complaint': { 'Complaint': 0.4, 'Statement': 0.4, 'Farewell': 0.2 },
    },
    'Noble': {
        'Greeting': { 'Statement': 0.5, 'Question': 0.4, 'Boast': 0.1 },
        'Statement': { 'Statement': 0.6, 'Question': 0.3, 'Farewell': 0.1 },
        'Question': { 'Statement': 0.8, 'Boast': 0.2 },
        'Boast': { 'Statement': 0.7, 'Farewell': 0.3 },
    },
    'Sarcastic': {
        'Greeting': { 'Joke': 0.5, 'Question': 0.3, 'Statement': 0.2 },
        'Statement': { 'Joke': 0.6, 'Sarcastic_Remark': 0.4 }, // Custom state for this personality
        'Question': { 'Sarcastic_Remark': 0.7, 'Question': 0.3 },
        'Joke': { 'Sarcastic_Remark': 0.5, 'Farewell': 0.5 },
        'Sarcastic_Remark': { 'Joke': 0.5, 'Farewell': 0.5 },
    },
    'Cheerful': {
        'Greeting': { 'Question': 0.5, 'Joke': 0.3, 'Statement': 0.2 },
        'Statement': { 'Joke': 0.5, 'Question': 0.5 },
        'Question': { 'Statement': 0.6, 'Greeting': 0.4 },
        'Joke': { 'Greeting': 0.5, 'Farewell': 0.5 },
    },
    'Scholarly': {
        'Greeting': { 'Question': 0.6, 'Statement': 0.4 },
        'Statement': { 'Question': 0.5, 'Statement': 0.4, 'Farewell': 0.1 },
        'Question': { 'Statement': 0.9, 'Farewell': 0.1 },
    },
};

function getNextDialogueState(personality: PersonalityType, currentState: DialogueState): DialogueState {
    const transitions = dialogueTransitions[personality]?.[currentState];
    if (!transitions) {
        return 'Statement'; // Fallback
    }
    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const state in transitions) {
        cumulativeProbability += (transitions as any)[state]!;
        if (rand < cumulativeProbability) {
            return state as DialogueState;
        }
    }
    return 'Statement'; // Fallback
}

function generateDialoguePath(personality: PersonalityType, length: number = 3): DialogueState[] {
    const path: DialogueState[] = [];
    let currentState: DialogueState = 'Greeting';
    path.push(currentState);
    
    for (let i = 1; i < length; i++) {
        currentState = getNextDialogueState(personality, currentState);
        path.push(currentState);
    }
    return path;
}
// #endregion

const PersonalitySchema = z.object({
  personality: z.enum(['Grumpy', 'Noble', 'Sarcastic', 'Cheerful', 'Scholarly', 'Other']),
});

const personalityPrompt = ai.definePrompt({
    name: 'determinePersonalityPrompt',
    input: { schema: GenerateDialogueInputSchema },
    output: { schema: PersonalitySchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `Analyze the following character details and determine their dominant personality trait from the given options.

    Name: {{{name}}}
    Archetype: {{{archetype}}}
    Biography: {{{biography}}}
    
    Choose the best fit from: Grumpy, Noble, Sarcastic, Cheerful, Scholarly. If none fit well, choose 'Other'.`,
});

const dialoguePrompt = ai.definePrompt({
    name: 'generateDialoguePrompt',
    input: { schema: z.object({
        name: z.string(),
        archetype: z.string(),
        biography: z.string(),
        dialoguePath: z.array(z.string()),
    })},
    output: { schema: GenerateDialogueOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a creative writer. Your task is to write a few characteristic lines of dialogue for the character described below.
    
    **Character Details:**
    - Name: {{{name}}}
    - Archetype: {{{archetype}}}
    - Biography: {{{biography}}}
    
    **Dialogue Structure:**
    You MUST generate dialogue that follows this narrative sequence of speech acts:
    {{#each dialoguePath}}
    - {{this}}
    {{/each}}
    
    **Instructions:**
    - Generate 3-5 short, impactful lines of dialogue or catchphrases.
    - The lines MUST reflect the character's personality and the required dialogue structure.
    - Return ONLY the dialogue lines in the 'dialogueLines' array. Do not add extra commentary.
    `,
});

export const generateDialogueFlow = ai.defineFlow(
  {
    name: 'generateDialogueFlow',
    inputSchema: GenerateDialogueInputSchema,
    outputSchema: GenerateDialogueOutputSchema,
  },
  async (input) => {
    // Step 1: Determine personality
    const personalityResult = await personalityPrompt(input);
    const personality = personalityResult.output?.personality || 'Noble';

    // Step 2: Generate dialogue path using Markov chain
    const pathPersonality = personality === 'Other' ? 'Noble' : personality; // Default to 'Noble' if personality is vague
    const dialoguePath = generateDialoguePath(pathPersonality, 3);
    
    // Step 3: Generate the actual dialogue based on the path
    const { output } = await dialoguePrompt({ ...input, dialoguePath });
    
    if (!output) {
      throw new Error('AI failed to generate dialogue.');
    }
    return output;
  }
);
