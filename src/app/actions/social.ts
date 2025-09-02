
'use server';

import { verifyAndGetUid } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Character } from '@/types/character';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};

// Functions from likes.ts are moved here
async function getLikeCount(supabase: any, characterId: string): Promise<number> {
    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', characterId);
    if (error) throw error;
    return count || 0;
}

export async function likeCharacter(characterId: string): Promise<ActionResponse & { newLikeCount?: number, liked?: boolean }> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    try {
        const { error } = await supabase.from('likes').insert({ character_id: characterId, user_id: uid });
        if (error) throw error;
        
        // This could be further optimized with database functions/triggers
        revalidatePath(`/showcase/${characterId}`);
        return { success: true, message: "Character liked!" };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to like character.", error: message };
    }
}

export async function unlikeCharacter(characterId: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };

    try {
       const { error } = await supabase.from('likes').delete().match({ character_id: characterId, user_id: uid });
       if (error) throw error;

        revalidatePath(`/showcase/${characterId}`);
        return { success: true, message: "Character unliked." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to unlike character.", error: message };
    }
}

export async function followUser(userIdToFollow: string): Promise<ActionResponse> {
    const currentUserId = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    if (currentUserId === userIdToFollow) return { success: false, message: "You cannot follow yourself." };

    try {
        const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userIdToFollow });
        if (error) throw error;

        revalidatePath(`/users/${userIdToFollow}`);
        return { success: true, message: "User followed." };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to follow user.", error: message };
    }
}

export async function unfollowUser(userIdToUnfollow: string): Promise<ActionResponse> {
    const currentUserId = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    
    try {
       const { error } = await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: userIdToUnfollow });
       if (error) throw error;

        revalidatePath(`/users/${userIdToUnfollow}`);
        return { success: true, message: "User unfollowed." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: "Failed to unfollow user.", error: message };
    }
}

export async function checkRelationship(userId: string, otherUserId: string): Promise<{ isFollowing: boolean; isFollowedBy: boolean;}> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { isFollowing: false, isFollowedBy: false };
    const [followingRes, followedByRes] = await Promise.all([
        supabase.from('follows').select('follower_id').eq('follower_id', userId).eq('following_id', otherUserId).maybeSingle(),
        supabase.from('follows').select('follower_id').eq('follower_id', otherUserId).eq('following_id', userId).maybeSingle()
    ]);
    return {
        isFollowing: !!followingRes.data,
        isFollowedBy: !!followedByRes.data,
    };
}

export async function getCharacterLikeStatus(characterId: string, userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;
    const { data, error } = await supabase.from('likes').select('user_id').eq('character_id', characterId).eq('user_id', userId).single();
    if(error && error.code !== 'PGRST116') console.error("Error getting like status", error);
    return !!data;
}
