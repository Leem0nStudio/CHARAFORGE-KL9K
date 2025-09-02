

'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import { toCharacterObject } from '@/services/character-hydrator';
import { PostgrestError } from '@supabase/supabase-js';

// Helper to fetch documents in batches of 30 for 'in' queries
async function fetchUsersInBatches(userIds: string[]): Promise<Map<string, UserProfile>> {
    const supabase = getSupabaseServerClient();
    if (!supabase || userIds.length === 0) return new Map();
    
    const results = new Map<string, UserProfile>();
    
    for (let i = 0; i < userIds.length; i += 30) {
        const batchIds = userIds.slice(i, i + 30);
        if (batchIds.length > 0) {
            const { data, error } = await supabase.from('users').select('*').in('id', batchIds);
            if (error) {
                console.error("Error fetching user batch:", error);
                continue;
            }
            data.forEach((user: any) => results.set(user.id, {
                uid: user.id,
                displayName: user.display_name,
                photoURL: user.photo_url,
                // Add other UserProfile fields as needed from the 'users' table
            } as UserProfile));
        }
    }
    return results;
}

/**
 * Takes a raw character data array from Supabase and enriches them with user info.
 * @param characterData The raw data array from a Supabase query.
 * @returns A promise that resolves to an array of hydrated Character objects.
 */
async function hydrateCharacters(characterData: any[]): Promise<Character[]> {
    if (!characterData || characterData.length === 0) {
        return [];
    }

    const characters: Character[] = await Promise.all(characterData.map(d => toCharacterObject(d.id, d)));
    
    const userIds = new Set<string>();
    characters.forEach(char => {
        if (char.meta.userId) userIds.add(char.meta.userId);
        if (char.lineage.originalAuthorId) userIds.add(char.lineage.originalAuthorId);
    });

    const userProfiles = await fetchUsersInBatches(Array.from(userIds));

    return characters.map(char => {
        return {
            ...char,
            meta: {
                ...char.meta,
                userName: userProfiles.get(char.meta.userId)?.displayName || 'Anonymous',
            },
            lineage: {
                ...char.lineage,
                originalAuthorName: char.lineage.originalAuthorId ? userProfiles.get(char.lineage.originalAuthorId)?.displayName || char.lineage.originalAuthorName || null : null,
            }
        };
    });
}


/**
 * Fetches public characters and ensures their image URLs are directly accessible.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects.
 */
export async function getPublicCharacters(): Promise<Character[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('meta_details->>status', 'public') // Querying inside JSONB
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    return hydrateCharacters(data);
  } catch (error) {
    console.error("Error fetching public characters:", error);
    return [];
  }
}

/**
 * Searches for public characters that contain a specific tag in their 'tags' array.
 * @param {string} tag The tag to search for.
 * @returns {Promise<Character[]>} A promise resolving to an array of matching characters.
 */
export async function searchCharactersByTag(tag: string): Promise<Character[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase || !tag) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('meta_details->>status', 'public')
            .contains('core_details->tags', [tag.toLowerCase()]) // Querying inside JSONB array
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;

        return hydrateCharacters(data);

    } catch (error) {
        console.error(`Error searching for tag "${tag}":`, error);
        return [];
    }
}


/**
 * Fetches the top 4 creators based on the number of characters they have created
 * and who have set their profile to public.
 * @returns {Promise<UserProfile[]>} A promise that resolves to an array of user profile objects.
 */
export async function getTopCreators(): Promise<UserProfile[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase.rpc('get_top_creators');

    if (error) throw error;
    
    const creators = data.map((d: any) => ({
        uid: d.id,
        displayName: d.display_name || null,
        photoURL: d.photo_url || null,
        stats: d.stats || {},
    })) as UserProfile[];

    return creators;

  } catch (error) {
    console.error("Error fetching top creators:", error);
    return [];
  }
}

/**
 * Fetches all public characters for a specific user.
 * @param {string} userId - The UID of the user whose characters to fetch.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects.
 */
export async function getPublicCharactersForUser(userId: string): Promise<Character[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .eq('meta_details->>status', 'public')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;

    return await hydrateCharacters(data);

  } catch (error) {
    console.error(`Error fetching public characters for user ${userId}:`, error);
    return [];
  }
}
