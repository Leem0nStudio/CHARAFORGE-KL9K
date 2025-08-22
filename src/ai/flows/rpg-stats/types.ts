/**
 * @fileOverview Data schemas and types for the RPG stat generation flow.
 */
import { z } from 'zod';

export const GenerateStatsInputSchema = z.object({
  archetype: z.string().describe("The character's class or archetype (e.g., 'Warrior', 'Mage')."),
  rarity: z.number().min(1).max(5).describe('The character\'s rarity on a scale of 1 to 5.'),
});
export type GenerateStatsInput = z.infer<typeof GenerateStatsInputSchema>;

export const GenerateStatsOutputSchema = z.object({
  strength: z.number().int(),
  dexterity: z.number().int(),
  constitution: z.number().int(),
  intelligence: z.number().int(),
  wisdom: z.number().int(),
  charisma: z.number().int(),
});
export type GenerateStatsOutput = z.infer<typeof GenerateStatsOutputSchema>;
