
'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Character } from '@/types/character';
import { toCharacterObject } from '@/services/character-hydrator';


export async function getCharacters(userId: string): Promise<Character[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];
    
    // Hydrate each character with user and datapack info
    const characters = await Promise.all(
        data.map(async (charData) => await toCharacterObject(charData.id, charData))
    );

    return characters;

  } catch (error) {
    console.error("Error fetching characters:", error);
    return [];
  }
}

export async function getCharacter(characterId: string): Promise<Character | null> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (error || !data) {
            console.error(`Error fetching character ${characterId}:`, error);
            return null;
        }

        const character = await toCharacterObject(data.id, data);
        
        return character;

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}
