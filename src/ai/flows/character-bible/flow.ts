
'use server';

/**
 * @fileoverview This Genkit flow implements the "Character Bible" generator.
 * It acts as an expert Concept Artist and Prompt Engineer, transforming high-level
 * user specifications into a detailed, structured JSON document (the "bible")
 * that can be used for consistent character generation across multiple images and media.
 */

import { ai } from '@/ai/genkit';
import { CharacterBibleInputSchema, CharacterBibleOutputSchema, type CharacterBible, type CharacterBibleInput } from './types';

// The master prompt that defines the AI's persona, rules, and output format.
const generateCharacterBiblePrompt = ai.definePrompt({
    name: 'generateCharacterBiblePrompt',
    input: { schema: CharacterBibleInputSchema },
    output: { schema: CharacterBibleOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',

    prompt: `You are a world-class Concept Artist & Prompt Engineer. Your task is to transform a user's character specifications into a detailed, consistent, and structured JSON document, which will serve as a "Character Bible". This bible will be used to generate consistent imagery for this character.

    **CRITICAL RULES OF ATTENTION AND CONSISTENCY:**
    1.  **STRICTLY ADHERE TO INPUT PREMISE:** Your primary and ONLY source of truth is the user's premise. You MUST NOT introduce concepts, themes, styles, or objects that are not explicitly mentioned or clearly implied by the user's input premise. For example, if the input is "a street photographer in casual clothes", you MUST NOT add cyberpunk elements, fantasy armor, or sci-fi gear. The final output must be 100% thematically consistent with the user's premise.
    2.  **Follow Every Step:** Read and process every instruction before generating the output.
    3.  **Maintain Consistency:** If 'series_id' and 'character_name' are provided, adhere to any implied context for consistency. Prioritize creating a clear silhouette, distinctive features, and a few repeatable visual motifs.
    4.  **Avoid Contradictions:** Logically validate your choices. For example, a character cannot wear "heavy greaves" and also be "barefoot". If you see a contradiction in the user input, resolve it logically (e.g., change 'bare' to 'thigh-high boots' to match 'boots').
    5.  **SFW Output:** All descriptions must be Safe-For-Work. Do not include explicit sexuality.
    6.  **JSON Only:** Your entire response must be ONLY the requested JSON object. Do not include any introductory text, markdown formatting, or explanations.

    **USER SPECIFICATIONS (Premise):**
    \`\`\`
    {{{premise}}}
    \`\`\`

    **YOUR TASK:**
    Fill out every single field in the following JSON schema. Infer any missing information reasonably based *only* on the user's provided premise, personality, and backstory. Be creative, detailed, and specific, but stay within the thematic boundaries of the input.

    **SCHEMA TO FILL:**
    \`\`\`json
    {
      "meta": { "series_id": "...", "character_name": "...", "seed_hint": "...", "tags": ["..."] },
      "identity": { "role": "...", "premise": "...", "personality": ["..."], "backstory": "..." },
      "visual_core": { "silhouette": "...", "motifs": ["..."], "palette": ["..."], "art_style": "...", "tone": ["..."] },
      "anatomy": { "body_type": "...", "skin_tone": "...", "face_shape": "...", "hair": {"color": "...", "style": "...", "length": "..."}, "eyes": {"color": "...", "shape": "..."}, "unique_marks": ["..."], "expression": "...", "body_language": "..." },
      "outfit": { "headgear": "...", "neck": "...", "shoulders": "...", "chest": "...", "arms": "...", "hands_gloves": "...", "waist_belt": "...", "legs": "...", "feet": "...", "back": "...", "accessories": ["..."] },
      "armament": { "primary": "...", "secondary": "...", "magic_fx": ["..."] },
      "scene": { "location": "...", "time_of_day": "...", "weather": "...", "pose": "...", "camera": "...", "lighting": "..." },
      "notes": "..."
    }
    \`\`\`
    `,
});

// The main flow function that orchestrates the call to the AI.
const generateCharacterBibleFlow = ai.defineFlow(
  {
    name: 'generateCharacterBibleFlow',
    inputSchema: CharacterBibleInputSchema,
    outputSchema: CharacterBibleOutputSchema,
  },
  async (input) => {
    const { output } = await generateCharacterBiblePrompt(input);
    
    if (!output) {
      throw new Error('Character Bible generation failed. The AI did not return a valid structured response.');
    }
    
    return output;
  }
);


// Exported wrapper function to be used by server actions.
export async function generateCharacterBible(input: CharacterBibleInput): Promise<CharacterBible> {
  return await generateCharacterBibleFlow(input);
}
