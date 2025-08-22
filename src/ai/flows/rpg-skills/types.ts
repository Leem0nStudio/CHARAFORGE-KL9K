/**
 * @fileOverview Data schemas and types for the RPG skill generation flow.
 */
import { z } from 'zod';

export const GenerateSkillsInputSchema = z.object({
  archetype: z.string().describe("The character's class or archetype (e.g., 'Grizzled Detective')."),
  equipment: z.array(z.string()).describe("A list of the character's key equipment or weapons."),
  biography: z.string().describe("The character's detailed, narrative biography."),
});
export type GenerateSkillsInput = z.infer<typeof GenerateSkillsInputSchema>;

const SkillSchema = z.object({
    id: z.string().describe('A unique identifier for the skill.'),
    name: z.string().describe('The name of the skill.'),
    description: z.string().describe('A brief description of what the skill does.'),
    power: z.number().min(1).max(10).describe('A numerical representation of the skill\'s power (1-10).'),
    type: z.enum(['attack', 'defense', 'utility']).describe('The category of the skill.'),
});

export const GenerateSkillsOutputSchema = z.object({
  skills: z.array(SkillSchema).describe("An array of 3-4 generated skills for the character."),
});
export type GenerateSkillsOutput = z.infer<typeof GenerateSkillsOutputSchema>;
