
/**
 * @fileoverview Data schemas and types for the Prompt Architect flow.
 */

import { z } from 'zod';

export const GenerateArchitectPromptInputSchema = z.object({
  focusModule: z.enum(['character_focus', 'scene_focus', 'action_focus', 'integrated'])
    .describe("The narrative module to use as a base for the prompt."),
  seed: z.number().optional().describe("A seed for the random number generator to ensure reproducibility."),
});
export type GenerateArchitectPromptInput = z.infer<typeof GenerateArchitectPromptInputSchema>;


export const GenerateArchitectPromptOutputSchema = z.object({
  prompt: z.string().describe('The final, generated narrative prompt.'),
  seed: z.number().describe('The seed used for generation, for reproducibility.'),
});
export type GenerateArchitectPromptOutput = z.infer<typeof GenerateArchitectPromptOutputSchema>;
