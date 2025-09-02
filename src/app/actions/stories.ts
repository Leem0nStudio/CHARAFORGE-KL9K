
'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { StoryCast } from '@/types/story';
import { generateStory as generateStoryFlow } from '@/ai/flows/story-generation/flow';
import type { Character } from '@/types/character';
import { toCharacterObject } from '@/services/character-hydrator';

type ActionResponse<T = null> = {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
};

// This now includes the full character sheet for a richer context.
type CharacterDetailsForAI = Pick<Character['core'], 'name' | 'biography' | 'alignment' | 'timeline' | 'archetype' | 'equipment' | 'physicalDescription'>;


export async function getUserCasts(): Promise<StoryCast[]> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase.from('story_casts')
            .select('*')
            .eq('user_id', uid)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        
        return data.map(row => ({
            ...row,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
        }));
    } catch (error) {
        console.error("Error fetching user casts:", error);
        return [];
    }
}


export async function createStoryCast(data: { name: string; description: string }): Promise<ActionResponse<StoryCast>> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    try {
        const newCastData = {
            user_id: uid,
            name: data.name,
            description: data.description,
            character_ids: [],
        };

        const { data: inserted, error } = await supabase.from('story_casts').insert(newCastData).select().single();
        if (error) throw error;

        revalidatePath('/lore-forge'); 

        return {
            success: true,
            message: 'New story cast created.',
            data: {
                ...inserted,
                 createdAt: new Date(inserted.created_at).getTime(),
                 updatedAt: new Date(inserted.updated_at).getTime(),
                 characterIds: inserted.character_ids,
            } as StoryCast,
        };
    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to create cast.', error: message };
    }
}

export async function updateStoryCastCharacters(castId: string, characterIds: string[]): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };

    const { data: castData, error: fetchError } = await supabase.from('story_casts').select('user_id').eq('id', castId).single();
    if (fetchError || !castData || castData.user_id !== uid) {
        return { success: false, message: 'Permission denied or cast not found.' };
    }

    const { error } = await supabase.from('story_casts').update({
        character_ids: characterIds,
        updated_at: new Date().toISOString(),
    }).eq('id', castId);
    
    if (error) {
        return { success: false, message: 'Failed to update cast', error: error.message };
    }
    
    revalidatePath('/lore-forge');
    return { success: true, message: 'Story cast updated.' };
}

export async function generateStory(castId: string, storyPrompt: string): Promise<ActionResponse<{ title: string; content: string }>> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    const { data: castData, error: fetchError } = await supabase.from('story_casts').select('*').eq('id', castId).single();
    if (fetchError || !castData || castData.user_id !== uid) {
        return { success: false, message: 'Permission denied or cast not found.' };
    }

    if (castData.character_ids.length === 0) {
        return { success: false, message: 'The cast is empty. Add characters before generating a story.' };
    }

    try {
        // Fetch full character details for the cast
        const { data: charactersData, error: charsError } = await supabase.from('characters').select('*').in('id', castData.character_ids);
        if (charsError) throw charsError;
        
        const charactersForAI: CharacterDetailsForAI[] = await Promise.all(
            charactersData.map(async doc => {
                const char = await toCharacterObject(doc.id, doc);
                return {
                    name: char.core.name,
                    biography: char.core.biography,
                    alignment: char.core.alignment || 'True Neutral',
                    timeline: char.core.timeline || [],
                    archetype: char.core.archetype || undefined,
                    equipment: char.core.equipment || undefined,
                    physicalDescription: char.core.physicalDescription || char.generation?.originalPrompt || undefined,
                };
            })
        );
        
        if (charactersForAI.length === 0) {
            return { success: false, message: 'None of the characters in the cast could be found.' };
        }

        const storyResult = await generateStoryFlow({
            prompt: storyPrompt,
            cast: charactersForAI,
        });

        return {
            success: true,
            message: 'Story generated successfully!',
            data: {
                title: storyResult.title,
                content: storyResult.story,
            }
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred while generating the story.';
        return { success: false, message, error: message };
    }
}
