/**
 * @fileOverview Data schemas and types for the character sheet generation flow.
 */

import {z} from 'genkit';
import { TextEngineConfigSchema } from '@/types/generation';

// This now imports the client-safe schema and uses it.
export { TextEngineConfigSchema };
export type { TextEngineConfig } from '@/types/generation';


export const GenerateCharacterSheetInputSchema = z.object({
  description: z.string().describe('A simple description of the character concept.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the output.'),
  engineConfig: TextEngineConfigSchema, // Use the imported client-safe schema
});
export type GenerateCharacterSheetInput = z.infer<typeof GenerateCharacterSheetInputSchema>;

export const GenerateCharacterSheetOutputSchema = z.object({
  name: z.string().describe("The character's generated name."),
  archetype: z.string().describe("The character's archetype, class, or role.").optional(),
  equipment: z.array(z.string()).describe("A list of the character's key equipment or weapons.").optional(),
  physicalDescription: z.string().describe("A detailed physical description suitable for an image prompt.").optional(),
  biography: z.string().describe("The character's detailed, narrative biography.").optional(),
  // Add stats and rarity to the output schema.
  stats: z.object({
    strength: z.number().int(),
    dexterity: z.number().int(),
    constitution: z.number().int(),
    intelligence: z.number().int(),
    wisdom: z.number().int(),
    charisma: z.number().int(),
  }),
  rarity: z.number().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
});
export type GenerateCharacterSheetOutput = z.infer<typeof GenerateCharacterSheetOutputSchema>;
