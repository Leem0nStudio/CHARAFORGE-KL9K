
import { z } from 'genkit';

const CharacterSchemaForStory = z.object({
    name: z.string().describe("The character's name."),
    biography: z.string().describe("A brief biography of the character."),
    alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']).describe("The character's moral and ethical alignment (D&D style).")
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

    