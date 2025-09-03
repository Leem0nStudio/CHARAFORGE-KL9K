
'use server';

import { ai } from '@/ai/genkit';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input and Output Schemas for the new skill generation flow
const GenerateSkillsInputSchema = z.object({
  characterId: z.string(),
  archetype: z.string(),
  biography: z.string(),
});

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
 * A server action that generates RPG skills for a character and saves them.
 * This is now a direct server action, no longer relying on a separate Cloud Function.
 * @param {string} characterId The ID of the character to generate skills for.
 * @param {string} archetype The character's archetype.
 * @param {string} biography The character's biography.
 * @returns {Promise<{success: boolean, message: string}>} A promise that resolves to a success or failure message.
 */
export async function generateAndSaveSkills(characterId: string, archetype: string, biography: string): Promise<{ success: boolean; message: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { success: false, message: 'Database service not available.' };
  }
  
  try {
    await supabase.from('characters').update({ rpg_details: { skillsStatus: 'pending' } }).eq('id', characterId);

    const { output } = await generateSkillsPrompt({
      characterId,
      archetype,
      biography,
    });
    
    if (!output || !output.skills || output.skills.length === 0) {
        throw new Error('AI failed to generate any skills.');
    }

    const skillsWithIds = output.skills.map(skill => ({
      ...skill,
      id: skill.name.toLowerCase().replace(/\s+/g, '-'),
    }));
    
    const { data: characterData, error: fetchError } = await supabase.from('characters').select('rpg_details').eq('id', characterId).single();
    if (fetchError) throw fetchError;

    const newRpgDetails = { ...characterData.rpg_details, skills: skillsWithIds, skillsStatus: 'complete' };

    await supabase.from('characters').update({ rpg_details: newRpgDetails }).eq('id', characterId);

    return { success: true, message: `Successfully generated ${skillsWithIds.length} skills.` };

  } catch (error: any) {
    console.error(`Error generating skills for character ${characterId}:`, error);
    await supabase.from('characters').update({ rpg_details: { skillsStatus: 'failed' } }).eq('id', characterId);
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
