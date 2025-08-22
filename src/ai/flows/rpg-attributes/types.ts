
/**
 * @fileoverview Data schemas and types for the unified RPG attribute generation flow.
 */
import { z } from 'zod';
import type { Character as FullCharacter } from '@/types/character';

// Input schema for the main flow. It takes the whole character object.
export const GenerateAllRpgAttributesInputSchema = z.custom<FullCharacter>();
export type GenerateAllRpgAttributesInput = FullCharacter;

// Schema for a single skill. The AI will generate data matching this structure.
export const SkillSchema = z.object({
    id: z.string().describe('A unique identifier for the skill.'),
    name: z.string().describe('The name of the skill.'),
    description: z.string().describe('A brief description of what the skill does.'),
    power: z.number().min(1).max(10).describe('A numerical representation of the skill\'s power (1-10).'),
    type: z.enum(['attack', 'defense', 'utility']).describe('The category of the skill.'),
});

// The final output schema of the flow, combining all generated attributes.
export const GenerateAllRpgAttributesOutputSchema = z.object({
  stats: z.object({
    strength: z.number().int(),
    dexterity: z.number().int(),
    constitution: z.number().int(),
    intelligence: z.number().int(),
    wisdom: z.number().int(),
    charisma: z.number().int(),
  }),
  rarity: z.number().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
  skills: z.array(SkillSchema).describe("An array of 3-4 generated skills for the character."),
});

export type GenerateAllRpgAttributesOutput = z.infer<typeof GenerateAllRpgAttributesOutputSchema>;
