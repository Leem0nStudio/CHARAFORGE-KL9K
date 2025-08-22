
/**
 * @fileOverview Data schemas and types for the character sheet generation flow.
 */

import {z} from 'genkit';
import { TextEngineConfigSchema } from '@/types/generation';
import type { Character } from '@/types/character';

// This now imports the client-safe schema and uses it.
export { TextEngineConfigSchema };
export type { TextEngineConfig } from '@/types/generation';

export const SkillSchema = z.object({
    id: z.string().describe('A unique identifier for the skill.'),
    name: z.string().describe('The name of the skill.'),
    description: z.string().describe('A brief description of what the skill does.'),
    power: z.number().min(1).max(10).describe('A numerical representation of the skill\'s power (1-10).'),
    type: z.enum(['attack', 'defense', 'utility']).describe('The category of the skill.'),
});

export const GenerateCharacterSheetInputSchema = z.object({
  description: z.string().describe('A simple description of the character concept.'),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).optional().describe('The target language for the output.'),
  engineConfig: TextEngineConfigSchema, // Use the imported client-safe schema
  existingCharacter: z.custom<Character>().optional().describe('The full existing character object, if regenerating.'),
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
  skills: z.array(SkillSchema).optional().describe("An array of 3-4 generated skills for the character."),
});
export type GenerateCharacterSheetOutput = z.infer<typeof GenerateCharacterSheetOutputSchema>;
