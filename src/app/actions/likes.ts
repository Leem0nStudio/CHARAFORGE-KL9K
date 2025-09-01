
'use server';

import { verifyAndGetUid } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';

async function getLikeCount(supabase: any, characterId: string): Promise<number> {
    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', characterId);
    if (error) throw error;
    return count || 0;
}

export async function getCharacterLikeStatus(characterId: string) {
    const supabase = getSupabaseServerClient();
    let uid: string | null = null;
    
    try {
        uid = await verifyAndGetUid();
    } catch (error) {
        uid = null;
    }
    
    try {
        const likeCount = await getLikeCount(supabase, characterId);
        let userHasLiked = false;

        if (uid) {
            const { data, error } = await supabase.from('likes').select('user_id').eq('character_id', characterId).eq('user_id', uid).single();
            if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
            userHasLiked = !!data;
        }

        return { success: true, likeCount, userHasLiked };

    } catch (error: any) {
        return { success: false, error: error.message, likeCount: 0, userHasLiked: false };
    }
}


export async function toggleLikeCharacter(characterId: string) {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    
    try {
        // Check if the user has already liked the character
        const { data: existingLike, error: likeError } = await supabase
            .from('likes')
            .select('user_id')
            .eq('character_id', characterId)
            .eq('user_id', uid)
            .single();

        if (likeError && likeError.code !== 'PGRST116') throw likeError;

        let liked: boolean;

        if (existingLike) {
            // Unlike
            const { error } = await supabase.from('likes').delete().match({ character_id: characterId, user_id: uid });
            if (error) throw error;
            liked = false;
        } else {
            // Like
            const { error } = await supabase.from('likes').insert({ character_id: characterId, user_id: uid });
            if (error) throw error;
            liked = true;
        }
        
        const newLikeCount = await getLikeCount(supabase, characterId);

        return { success: true, newLikeCount, liked };

    } catch (error: any) {
        console.error('Like toggle transaction failed:', error);
        return { success: false, error: error.message };
    }
}
