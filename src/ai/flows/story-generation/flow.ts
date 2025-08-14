
'use server';

/**
 * @fileOverview Story generation AI agent.
 */

import { ai } from '@/ai/genkit';
import { GenerateStoryInputSchema, GenerateStoryOutputSchema, type GenerateStoryInput, type GenerateStoryOutput } from './types';


export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const generateStoryPrompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: { schema: GenerateStoryInputSchema },
  output: { schema: GenerateStoryOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a master storyteller and author. Your task is to write a compelling, coherent short story based on a given prompt and a cast of characters.

  **Story Prompt/Theme:**
  {{{prompt}}}

  **Cast of Characters:**
  {{#each cast}}
  - **Name:** {{name}}
    - **Archetype:** {{archetype}}
    - **Alignment:** {{alignment}}
    - **Appearance:** {{physicalDescription}}
    - **Biography:** {{biography}}
    {{#if equipment.length}}
    - **Key Equipment:** {{#each equipment}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}
    {{#if timeline.length}}
    - **Key Life Events (Timeline):**
      {{#each timeline}}
      - **{{date}}:** {{title}} - {{description}}
      {{/each}}
    {{/if}}
  {{/each}}

  **Instructions:**
  1.  **Incorporate All Characters:** Every character from the cast must play a meaningful role in the story.
  2.  **Respect Character Details:** The story must be consistent with ALL of each character's details: their archetype, appearance, equipment, biography, alignment, and key life events. Use their backstories to inform their motivations and actions.
  3.  **Create a Narrative Arc:** The story should have a clear beginning, middle, and end. Introduce a conflict, develop it through character interactions, and provide a satisfying resolution.
  4.  **Generate a Title:** Create a short, evocative title for the story that captures its essence.
  5.  **Output Format:** Respond ONLY with the JSON object containing the 'title' and 'story'. Do not include any other commentary.
  `,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async (input) => {
    const { output } = await generateStoryPrompt(input);
    if (!output) {
        throw new Error("AI failed to generate a story. The prompt might be too complex or contain sensitive content.");
    }
    return output;
  }
);
    
