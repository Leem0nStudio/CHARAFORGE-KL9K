
'use server';

import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { Character } from '@/types/character';

// Input and Output Schemas for the new skill generation flow
const GenerateSkillsInputSchema = z.object({
  characterId: z.string(),
  archetype: z.string(),
  biography: z.string(),
});
type GenerateSkillsInput = z.infer<typeof GenerateSkillsInputSchema>;

const SkillSchema = z.object({
  name: z.string().describe("A cool, evocative name for the skill."),
  description: z.string().describe("A brief, one-sentence description of what the skill does."),
  power: z.number().min(1).max(10).describe("The skill's power level from 1 to 10."),
  type: z.enum(['attack', 'defense', 'utility']).describe("The type of skill."),
});

const GenerateSkillsOutputSchema = z.object({
  skills: z.array(SkillSchema).max(3).describe("A list of exactly 3 unique skills for the character."),
});


const generateSkillsPrompt = ai.definePrompt({
  name: 'generateSkillsPrompt',
  input: { schema: GenerateSkillsInputSchema },
  output: { schema: GenerateSkillsOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a creative game designer. Your task is to generate exactly 3 unique and thematic combat skills for a character based on their archetype and biography.

  Character Archetype: {{{archetype}}}
  Character Biography:
  {{{biography}}}

  Instructions:
  - Generate 3 distinct skills.
  - One skill should be for 'attack'.
  - One skill should be for 'defense'.
  - One skill should be for 'utility'.
  - The skills must be thematically consistent with the character's archetype and story.
  - The power level should be balanced. Not all skills should be a 10.
  - Be creative and give the skills interesting names and descriptions.
  `,
});

/**
 * A server action that generates RPG skills for a character and saves them to Firestore.
 * This function is intended to be called by a Cloud Function trigger.
 * @param {string} characterId The ID of the character to generate skills for.
 * @returns {Promise<{success: boolean, message: string}>} A promise that resolves to a success or failure message.
 */
export async function generateAndSaveSkills(characterId: string): Promise<{ success: boolean; message: string }> {
  if (!adminDb) {
    throw new Error('Database service is unavailable.');
  }

  const characterRef = adminDb.collection('characters').doc(characterId);
  await characterRef.update({ 'rpg.skillsStatus': 'pending' });

  try {
    const characterDoc = await characterRef.get();
    if (!characterDoc.exists) {
      throw new Error(`Character with ID ${characterId} not found.`);
    }
    const characterData = characterDoc.data() as Character;

    if (!characterData.core.archetype) {
      await characterRef.update({ 'rpg.skillsStatus': 'failed' });
      return { success: false, message: 'Character has no archetype set.' };
    }

    const { output } = await generateSkillsPrompt({
      characterId,
      archetype: characterData.core.archetype,
      biography: characterData.core.biography,
    });
    
    if (!output || !output.skills || output.skills.length === 0) {
        throw new Error('AI failed to generate any skills.');
    }

    const skillsWithIds = output.skills.map(skill => ({
      ...skill,
      id: skill.name.toLowerCase().replace(/\s+/g, '-'),
    }));

    await characterRef.update({
      'rpg.skills': skillsWithIds,
      'rpg.skillsStatus': 'complete',
    });

    return { success: true, message: `Successfully generated ${skillsWithIds.length} skills for ${characterData.core.name}.` };

  } catch (error: any) {
    console.error(`Error generating skills for character ${characterId}:`, error);
    await characterRef.update({ 'rpg.skillsStatus': 'failed' });
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
