
'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character, TimelineEvent, RpgAttributes } from '@/types/character';
import { v4 as uuidv4 } from 'uuid';
import { uploadToStorage } from '@/services/storage';
import { SaveCharacterInputSchema, type SaveCharacterInput } from '@/types/character';
import { generateCharacterSheet } from '@/ai/flows/character-sheet/flow';
import { getNextLifeState, LifeEventState } from '@/ai/flows/character-sheet/flow';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateDialogueFlow } from '@/ai/flows/dialogue-generation/flow';
import { generateSpeech } from '@/ai/flows/text-to-speech/flow';
import { generateAndSaveSkills } from './rpg';
import { toCharacterObject } from '@/services/character-hydrator';

// #region Helper Functions for Stat Generation
type Stat = keyof RpgAttributes['stats'];
const STAT_KEYS: Stat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const archetypeStatPriorities: Record<string, [Stat, Stat] | [Stat]> = {
    Artificer: ['intelligence', 'constitution'],
    Barbarian: ['strength', 'constitution'],
    Bard: ['charisma', 'dexterity'],
    Cleric: ['wisdom', 'constitution'],
    Druid: ['wisdom', 'constitution'],
    Fighter: ['strength', 'dexterity'],
    Monk: ['dexterity', 'wisdom'],
    Paladin: ['strength', 'charisma'],
    Ranger: ['dexterity', 'wisdom'],
    Rogue: ['dexterity', 'charisma'],
    Sorcerer: ['charisma', 'constitution'],
    Warlock: ['charisma', 'constitution'],
    Wizard: ['intelligence', 'constitution'],
};

function roll4d6DropLowest(): number {
    const rolls = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => a - b);
    rolls.shift();
    return rolls.reduce((sum, roll) => sum + roll, 0);
}

function generateBalancedStats(archetype: string): RpgAttributes['stats'] {
    const statPool = Array(6).fill(0).map(() => roll4d6DropLowest());
    statPool.sort((a, b) => b - a);

    const priorities = archetypeStatPriorities[archetype as keyof typeof archetypeStatPriorities] || [];
    const remainingStats = STAT_KEYS.filter(stat => !priorities.includes(stat));

    const finalStats: Partial<RpgAttributes['stats']> = {};

    priorities.forEach((priorityStat) => {
        const value = statPool.shift();
        if (value !== undefined) finalStats[priorityStat] = value;
    });

    remainingStats.forEach(stat => {
        const value = statPool.shift();
        if (value !== undefined) finalStats[stat] = value;
    });

    return finalStats as RpgAttributes['stats'];
}

function calculateRarity(stats: RpgAttributes['stats']): Character['core']['rarity'] {
    const totalScore = Object.values(stats).reduce((sum, value) => sum + value, 0);
    if (totalScore >= 90) return 5;
    if (totalScore >= 80) return 4;
    if (totalScore >= 65) return 3;
    if (totalScore >= 50) return 2;
    return 1;
}
// #endregion


type ActionResponse = {
    success: boolean;
    message: string;
    characterId?: string;
    skills?: RpgAttributes['skills'];
    error?: string;
};

export async function saveCharacter(input: SaveCharacterInput) {
  const validation = SaveCharacterInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    throw new Error(`Invalid input for ${firstError.path.join('.')}: ${firstError.message}`);
  }
  const { 
      bible, imageUrl: imageDataUri, dataPackId,
      textEngine, imageEngine, wizardData, originalPrompt
  } = validation.data;
  
  const userId = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();
  
  try {
    const characterId = uuidv4();
    
    const destinationPath = `raw-uploads/${userId}/${characterId}/${uuidv4()}.png`;
    const storageUrl = await uploadToStorage(imageDataUri, destinationPath);

    const archetype = bible.identity.role;
    const isPlayable = !!archetype;
    const wizardTags = wizardData ? Object.values(wizardData).map(tag => typeof tag === 'string' ? tag.trim().toLowerCase().replace(/ /g, '_') : '').filter(Boolean) : [];
    const uniqueTags = [...new Set([...wizardTags, ...bible.meta.tags].filter(Boolean))];

    const version = 1;
    const versionName = `v.${version}`;
    const initialVersion = { id: characterId, name: versionName, version: version };

    const newCharacterData: Omit<Character, 'id'> = {
        core: {
            name: bible.meta.character_name,
            biography: bible.identity.backstory,
            archetype: archetype || null,
            alignment: 'True Neutral',
            equipment: [bible.armament.primary, bible.armament.secondary].filter(Boolean),
            physicalDescription: bible.scene.pose,
            birthYear: 'Year 1',
            weaknesses: 'None',
            timeline: [],
            tags: uniqueTags,
            rarity: 1,
        },
        visuals: {
            imageUrl: storageUrl,
            gallery: [storageUrl],
            showcaseImageUrl: null,
            isShowcaseProcessed: false,
            showcaseProcessingStatus: 'idle',
        },
        meta: {
            userId,
            status: 'private',
            createdAt: new Date(), // Placeholder
            isNsfw: false,
            dataPackId: dataPackId || null,
            likes: 0,
        },
        lineage: {
            version: version,
            versionName: versionName,
            baseCharacterId: characterId,
            versions: [initialVersion],
            branchedFromId: null,
            originalAuthorId: null,
        },
        settings: {
            isSharedToDataPack: false,
            branchingPermissions: 'private',
        },
        generation: {
            textEngine: textEngine,
            imageEngine: imageEngine,
            wizardData: wizardData || null,
            originalPrompt: originalPrompt,
        },
        rpg: {
            isPlayable: isPlayable,
            level: 1,
            experience: 0,
            willpower: { current: 10, max: 10 },
            skills: [],
            statsStatus: isPlayable ? 'pending' : 'complete',
            skillsStatus: 'pending',
            stats: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        }
    };
    
    // Map to snake_case for Supabase insertion
    const newRow = {
        id: characterId,
        user_id: userId,
        name: newCharacterData.core.name,
        archetype: newCharacterData.core.archetype,
        biography: newCharacterData.core.biography,
        image_url: newCharacterData.visuals.imageUrl,
        core_details: newCharacterData.core,
        visual_details: newCharacterData.visuals,
        lineage_details: newCharacterData.lineage,
        generation_details: newCharacterData.generation,
        meta_details: newCharacterData.meta,
        settings_details: newCharacterData.settings,
        rpg_details: newCharacterData.rpg,
    };

    const { error } = await supabase.from('characters').insert(newRow);
    if (error) throw error;
    
    // Note: User stats update (achievements, etc.) would require another call or a database function.
    // This is simplified for the migration.

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}/edit`);

    return { success: true, characterId: characterId, message: 'Character saved successfully' };
  } catch (error) {
    console.error('Error saving character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Could not save character due to a server error.';
    throw new Error(errorMessage);
  }
}


export async function deleteCharacter(characterId: string) {
  const uid = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();
  if (!characterId) {
    throw new Error('Character ID is required for deletion.');
  }
  
  try {
    const { data: characterData, error: fetchError } = await supabase
      .from('characters')
      .select('user_id')
      .eq('id', characterId)
      .single();

    if (fetchError || !characterData || characterData.user_id !== uid) {
      throw new Error('Permission denied or character not found.');
    }
    
    const { error: deleteError } = await supabase.from('characters').delete().eq('id', characterId);
    if (deleteError) throw deleteError;

    revalidatePath('/characters');
    return { success: true };
  } catch (error) {
    console.error("Error deleting character:", error);
    throw new Error(error instanceof Error ? error.message : 'Could not delete character due to a server error.');
  }
}

export async function updateCharacterStatus(
  characterId: string, 
  status: 'private' | 'public',
  isNsfw?: boolean,
): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();
  
  try {
    const { data: characterData, error: fetchError } = await supabase
      .from('characters')
      .select('user_id, meta_details, settings_details, visual_details')
      .eq('id', characterId)
      .single();

    if (fetchError || !characterData || characterData.user_id !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }
    
    const newMeta = { ...characterData.meta_details, status: status };
    if (typeof isNsfw === 'boolean') {
        newMeta.isNsfw = isNsfw;
    }

    const { error: updateError } = await supabase
        .from('characters')
        .update({ meta_details: newMeta })
        .eq('id', characterId);
    if (updateError) throw updateError;
    
    // Note: Datapack cover image update logic and achievements would need separate handling.

    revalidatePath('/characters');
    revalidatePath('/'); 
    revalidatePath(`/characters/${characterId}/edit`);

    return { success: true, message: `Character status updated.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character status.';
    return { success: false, message };
  }
}

export async function updateCharacterDataPackSharing(characterId: string, isShared: boolean): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();

  try {
    const { data: characterData, error: fetchError } = await supabase
      .from('characters')
      .select('user_id, meta_details, settings_details')
      .eq('id', characterId)
      .single();

    if (fetchError || !characterData || characterData.user_id !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    if (!characterData.meta_details.dataPackId) {
        return { success: false, message: 'This character was not created with a DataPack.' };
    }
    
    const newSettings = { ...characterData.settings_details, isSharedToDataPack: isShared };
    const newMeta = { ...characterData.meta_details };
    if (isShared) {
        newMeta.status = 'public';
    }

    const { error: updateError } = await supabase
        .from('characters')
        .update({ settings_details: newSettings, meta_details: newMeta })
        .eq('id', characterId);
    if(updateError) throw updateError;
    
    revalidatePath('/characters');
    revalidatePath(`/datapacks/${characterData.meta_details.dataPackId}`);
    revalidatePath('/');
    revalidatePath(`/characters/${characterId}/edit`);
    
    return { success: true, message: `Sharing status for DataPack gallery updated.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update sharing status.';
    return { success: false, message };
  }
}

export async function updateCharacter(
    characterId: string, 
    data: Partial<Character['core']>
): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();
  
  try {
    const UpdateCharacterCoreSchema = z.object({
        name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
        biography: z.string().min(1, "Biography is required.").max(15000, "Biography is too long."),
        alignment: z.enum(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']),
        archetype: z.string().optional(),
        equipment: z.array(z.string()).optional(),
        physicalDescription: z.string().optional(),
        birthYear: z.string().optional(),
        weaknesses: z.string().optional(),
    });

    const validatedFields = UpdateCharacterCoreSchema.safeParse(data);

    if (!validatedFields.success) {
        const firstError = validatedFields.error.errors[0];
        return {
            success: false,
            message: `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`,
        };
    }
    
    const { data: existingData, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
    
    if (fetchError || !existingData || existingData.user_id !== uid) {
        return { success: false, message: 'Permission denied or character not found.' };
    }
    
    const newCoreDetails = { ...existingData.core_details, ...validatedFields.data };
    
    const updates: any = {
        core_details: newCoreDetails,
        name: newCoreDetails.name,
        archetype: newCoreDetails.archetype,
        biography: newCoreDetails.biography
    };
    
    // Check if the archetype has changed.
    const hasArchetypeChanged = existingData.core_details.archetype !== newCoreDetails.archetype;
    
    if (hasArchetypeChanged) {
        const newRpgDetails = { ...existingData.rpg_details };
        newRpgDetails.stats = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
        newRpgDetails.isPlayable = !!newCoreDetails.archetype;
        newRpgDetails.skills = [];
        newRpgDetails.skillsStatus = 'pending';
        newRpgDetails.statsStatus = 'pending';
        
        updates.rpg_details = newRpgDetails;
        updates.core_details.rarity = 1;
    }
    
    const { error: updateError } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', characterId);

    if (updateError) throw updateError;
  
    revalidatePath(`/characters/${characterId}/edit`);
    revalidatePath('/characters');
    
    return { success: true, message: 'Character details updated successfully!' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update character due to a server error.';
    return { success: false, message };
  }
}



export async function updateCharacterTimeline(characterId: string, timeline: TimelineEvent[]): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    
    try {
        const { data: existing, error: fetchError } = await supabase
            .from('characters')
            .select('user_id, core_details')
            .eq('id', characterId)
            .single();

        if (fetchError || !existing || existing.user_id !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        const newCoreDetails = { ...existing.core_details, timeline: timeline };
        const { error: updateError } = await supabase
            .from('characters')
            .update({ core_details: newCoreDetails })
            .eq('id', characterId);
        
        if (updateError) throw updateError;
        
        revalidatePath(`/characters/${characterId}/edit`);
        
        return { success: true, message: 'Timeline updated successfully!' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update timeline.';
        return { success: false, message };
    }
}


export async function updateCharacterBranchingPermissions(characterId: string, permissions: 'private' | 'public'): Promise<ActionResponse> {
  const uid = await verifyAndGetUid();
  const supabase = getSupabaseServerClient();

  try {
    const { data: existing, error: fetchError } = await supabase
        .from('characters')
        .select('user_id, settings_details, meta_details')
        .eq('id', characterId)
        .single();
    
    if (fetchError || !existing || existing.user_id !== uid) {
      return { success: false, message: 'Permission denied or character not found.' };
    }

    if (permissions === 'public' && existing.meta_details.status !== 'public') {
        return { success: false, message: 'Character must be public to allow branching.' };
    }
    
    const newSettings = { ...existing.settings_details, branchingPermissions: permissions };
    const { error: updateError } = await supabase
        .from('characters')
        .update({ settings_details: newSettings })
        .eq('id', characterId);
    
    if (updateError) throw updateError;

    revalidatePath(`/characters/${characterId}/edit`);
    return { success: true, message: 'Branching permissions updated.' };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update permissions.';
    return { success: false, message };
  }
}

export async function addCharacterExperience(characterId: string, xp: number): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    try {
        const { data: existing, error: fetchError } = await supabase
            .from('characters')
            .select('user_id, rpg_details')
            .eq('id', characterId)
            .single();

        if (fetchError || !existing || existing.user_id !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }
        
        const newRpg = { ...existing.rpg_details, experience: (existing.rpg_details.experience || 0) + xp };
        const { error: updateError } = await supabase
            .from('characters')
            .update({ rpg_details: newRpg })
            .eq('id', characterId);
        
        if (updateError) throw updateError;
        
        revalidatePath(`/showcase/${characterId}`);
        
        return { success: true, message: `${xp} XP gained!` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not add experience.';
        return { success: false, message };
    }
}

export async function suggestNextTimelineEvent(characterId: string): Promise<ActionResponse & { data?: TimelineEvent }> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    try {
        const { data: existing, error: fetchError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (fetchError || !existing || existing.user_id !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }

        const character = await toCharacterObject(existing.id, existing);
        const lastEvent = character.core.timeline?.[character.core.timeline.length - 1];
        
        const findStateFromTitle = (title: string): LifeEventState | null => {
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('born') || lowerTitle.includes('childhood')) return 'Humble Beginnings';
            if (lowerTitle.includes('victory') || lowerTitle.includes('succeeded')) return 'Great Victory';
            if (lowerTitle.includes('loss') || lowerTitle.includes('failed')) return 'Devastating Loss';
            if (lowerTitle.includes('betray')) return 'Betrayal';
            if (lowerTitle.includes('train')) return 'Intense Training';
            return null;
        }

        const lastState = lastEvent ? findStateFromTitle(lastEvent.title) : null;
        const nextState = await getNextLifeState(lastState || 'Humble Beginnings');

        const prompt = `You are a creative writer. Based on the character below and a suggested life event type, generate a concise, compelling timeline event.

Character Name: ${character.core.name}
Character Archetype: ${character.core.archetype}
Character Biography: ${character.core.biography}

Last Timeline Event: ${lastEvent ? `${lastEvent.title} (${lastEvent.date})` : 'None'}

Suggested Next Event Type: "${nextState}"

Generate a JSON object with three fields: "date" (a creative date, like "A Year Later" or "Age 30"), "title" (a short, dramatic title for the event), and "description" (a one-sentence summary of what happened).
`;
        
        const { output } = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            prompt,
            output: {
                format: 'json',
                schema: z.object({
                    date: z.string(),
                    title: z.string(),
                    description: z.string(),
                })
            }
        });

        if (!output) {
            throw new Error('AI failed to generate a timeline event.');
        }

        const newEvent: TimelineEvent = {
            id: uuidv4(),
            ...output,
        };

        return { success: true, message: 'Event suggested!', data: newEvent };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to suggest an event.';
        return { success: false, message };
    }
}


export async function generateDialogue(characterId: string): Promise<ActionResponse & { dialogueLines?: string[] }> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    try {
        const { data: existing, error: fetchError } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (fetchError || !existing || existing.user_id !== uid) {
            return { success: false, message: 'Permission denied or character not found.' };
        }

        const character = await toCharacterObject(existing.id, existing);
        
        const result = await generateDialogueFlow({
            name: character.core.name,
            archetype: character.core.archetype || 'Adventurer',
            biography: character.core.biography,
        });

        if (!result.dialogueLines || result.dialogueLines.length === 0) {
            throw new Error('AI failed to generate any dialogue.');
        }

        return { success: true, message: 'Dialogue generated!', dialogueLines: result.dialogueLines };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate dialogue.';
        return { success: false, message, error: message };
    }
}

export async function rollForCharacterStats(characterId: string): Promise<ActionResponse & { newStats?: RpgAttributes['stats'] }> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    try {
        const { data: characterData, error: fetchError } = await supabase
            .from('characters')
            .select('user_id, core_details, rpg_details, biography')
            .eq('id', characterId)
            .single();

        if (fetchError || !characterData || characterData.user_id !== uid) {
            return { success: false, message: "Permission denied or character not found." };
        }
        if (!characterData.core_details.archetype) {
            return { success: false, message: "Character must have an Archetype to roll for stats." };
        }

        const newStats = generateBalancedStats(characterData.core_details.archetype);
        const newRarity = calculateRarity(newStats);
        
        const newCore = { ...characterData.core_details, rarity: newRarity };
        const newRpg = { ...characterData.rpg_details, stats: newStats, statsStatus: 'complete', skillsStatus: 'pending' };

        const { error: updateError } = await supabase
            .from('characters')
            .update({ rpg_details: newRpg, core_details: newCore })
            .eq('id', characterId);
        
        if (updateError) throw updateError;
        
        await generateAndSaveSkills(characterId, characterData.core_details.archetype, characterData.biography);
        
        revalidatePath(`/characters/${characterId}/edit`);

        return { success: true, message: "Stats and skills generated successfully!", newStats };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to roll for stats.";
        await supabase
            .from('characters')
            .update({ rpg_details: { statsStatus: 'failed', skillsStatus: 'failed' }})
            .eq('id', characterId);
        return { success: false, message };
    }
}

export async function narrateBiography(characterId: string): Promise<ActionResponse & { audioUrl?: string }> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    try {
        const { data: characterData, error: fetchError } = await supabase
            .from('characters')
            .select('user_id, biography')
            .eq('id', characterId)
            .single();

        if (fetchError || !characterData || characterData.user_id !== uid) {
            return { success: false, message: "Permission denied or character not found." };
        }
        
        if (!characterData.biography) {
            return { success: false, message: "This character has no biography to narrate." };
        }
        
        const { audioDataUri } = await generateSpeech({ textToNarrate: characterData.biography });

        if (!audioDataUri) {
            throw new Error('The AI failed to generate any audio.');
        }

        return { success: true, message: 'Biography narrated successfully!', audioUrl: audioDataUri };

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to narrate biography.";
        return { success: false, message, error: message };
    }
}
