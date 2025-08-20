
/**
 * @fileOverview Data schemas and types for the story generation flow.
 * This file defines the Zod schemas for input and output validation,
 * and exports the corresponding TypeScript types.
 */

import { z } from 'genkit';
import type { Character } from '@/types/character';

const TimelineEventSchemaForStory = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    description: z.string(),
});

const CharacterSchemaForStory = z.object({
    name: z.string().describe("The character's name."),
    archetype: z.string().optional().describe("The character's class or archetype (e.g., 'Grizzled Detective')."),
    physicalDescription: z.string().optional().describe("A detailed physical description of the character's appearance and clothing."),
    biography: z.string().describe("A brief biography of the character."),
    alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']).describe("The character's moral and ethical alignment (D&D style)."),
    equipment: z.array(z.string()).optional().describe("A list of the character's key equipment or weapons."),
    timeline: z.array(TimelineEventSchemaForStory).optional().describe("An optional list of key events from the character's life."),
});

export const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('A brief prompt or theme for the story.'),
  cast: z.array(CharacterSchemaForStory).describe("The cast of characters to be included in the story."),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

export const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('A compelling title for the generated story.'),
  story: z.string().describe('The full, generated story, written in a narrative format.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;
