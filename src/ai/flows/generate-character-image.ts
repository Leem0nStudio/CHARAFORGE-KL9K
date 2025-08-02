'use server';

/**
 * @fileOverview An AI agent for generating character images based on a description.
 *
 * - generateCharacterImage - A function that handles the character image generation process.
 * - GenerateCharacterImageInput - The input type for the generateCharacterImage function.
 * - GenerateCharacterImageOutput - The return type for the generateCharacterImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated character image.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;

export async function generateCharacterImage(input: GenerateCharacterImageInput): Promise<GenerateCharacterImageOutput> {
  return generateCharacterImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCharacterImagePrompt',
  input: {schema: GenerateCharacterImageInputSchema},
  output: {schema: GenerateCharacterImageOutputSchema},
  prompt: `Generate an image of a character based on the following description: {{{description}}}`,
});

const generateCharacterImageFlow = ai.defineFlow(
  {
    name: 'generateCharacterImageFlow',
    inputSchema: GenerateCharacterImageInputSchema,
    outputSchema: GenerateCharacterImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.description,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate character image.');
    }

    return {imageUrl: media.url};
  }
);
