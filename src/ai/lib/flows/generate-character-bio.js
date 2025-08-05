'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCharacterBio = generateCharacterBio;
/**
 * @fileOverview Character biography generation AI agent.
 *
 * - generateCharacterBio - A function that generates a character biography from a description.
 * - GenerateCharacterBioInput - The input type for the generateCharacterBio function.
 * - GenerateCharacterBioOutput - The return type for the generateCharacterBio function.
 */
const genkit_1 = require("../genkit"); // Changed from '@/ai/genkit'
const genkit_2 = require("genkit");
const GenerateCharacterBioInputSchema = genkit_2.z.object({
    description: genkit_2.z.string().describe('A description of the character.'),
});
const GenerateCharacterBioOutputSchema = genkit_2.z.object({
    biography: genkit_2.z.string().describe('The generated biography of the character.'),
});
async function generateCharacterBio(input) {
    return generateCharacterBioFlow(input);
}
const generateCharacterBioPrompt = genkit_1.ai.definePrompt({
    name: 'generateCharacterBioPrompt',
    input: { schema: GenerateCharacterBioInputSchema },
    output: { schema: GenerateCharacterBioOutputSchema },
    model: 'googleai/gemini-1.5-flash-latest',
    prompt: `You are a professional writer specializing in character biographies.

  Based on the provided description, generate a detailed and engaging biography for the character.

  Description: {{{description}}}`,
});
const generateCharacterBioFlow = genkit_1.ai.defineFlow({
    name: 'generateCharacterBioFlow',
    inputSchema: GenerateCharacterBioInputSchema,
    outputSchema: GenerateCharacterBioOutputSchema,
}, async (input) => {
    const { output } = await generateCharacterBioPrompt(input);
    return output;
});
//# sourceMappingURL=generate-character-bio.js.map