
'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Character } from '@/types/character';
import type { UserProfile, UserPreferences } from '@/types/user';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    newAvatarUrl?: string;
};

// Helper function to get the current user's ID from Supabase Auth
async function verifyAndGetUid(): Promise<string> {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated.');
    }
    return user.id;
}

const UpdateUserProfileSchema = z.object({
    displayName: z.string().min(1, "Display name is required.").max(50, "Display name cannot exceed 50 characters."),
    bio: z.string().max(500, "Biography cannot exceed 500 characters.").optional(),
    socialLinks: z.object({
        twitter: z.string().url("Invalid Twitter URL.").or(z.literal("")).optional(),
        artstation: z.string().url("Invalid ArtStation URL.").or(z.literal("")).optional(),
        website: z.string().url("Invalid Website URL.").or(z.literal("")).optional(),
    }).optional(),
}).partial();

export async function updateUserProfile(prevState: any, formData: FormData): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    const rawData = {
        displayName: formData.get('displayName'),
        bio: formData.get('bio'),
        socialLinks: {
            twitter: formData.get('socialLinks.twitter'),
            artstation: formData.get('socialLinks.artstation'),
            website: formData.get('socialLinks.website'),
        },
    };

    const validation = UpdateUserProfileSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }
    
    const { displayName, bio, socialLinks } = validation.data;
    let newAvatarUrl: string | undefined = undefined;

    const photoFile = formData.get('photoFile') as File;
    if (photoFile && photoFile.size > 0) {
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(`${uid}/avatar.png`, photoFile, {
                upsert: true,
                contentType: photoFile.type,
            });
        
        if (uploadError) {
             return { success: false, message: 'Failed to upload avatar.', error: uploadError.message };
        }
        
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        newAvatarUrl = urlData.publicUrl;
    }
    
    // In Supabase, profile data is stored on the users table.
    const { data, error } = await supabase
        .from('users')
        .update({ 
            display_name: displayName,
            photo_url: newAvatarUrl, // Only update if new one was uploaded
            profile: {
                bio,
                socialLinks,
            }
         })
        .eq('id', uid);

    if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, message: 'Failed to update profile.', error: error.message };
    }
    
    revalidatePath('/profile');
    return { success: true, message: 'Profile updated successfully.', newAvatarUrl };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
    
    if (error || !data) {
        console.error(`Error fetching public user profile for ${uid}:`, error);
        return null;
    }
    
    // Adapt the Firestore structure to the Supabase one
    return {
        uid: data.id,
        displayName: data.display_name || 'Anonymous',
        photoURL: data.photo_url || null,
        bio: data.profile?.bio || '',
        profile: data.profile || {},
        stats: data.stats || {},
        email: data.email || null,
        role: data.role || 'user',
        preferences: data.preferences || {},
    } as UserProfile;
}

export async function getUserCharacters(): Promise<Pick<Character, 'id' | 'core' | 'visuals'>[]> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
        .from('characters')
        .select('id, core_details, visual_details') // Assuming these are JSONB columns
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching user characters:', error);
        return [];
    }

    return data.map((char: any) => ({
        id: char.id,
        core: { name: char.core_details.name, archetype: char.core_details.archetype, rarity: char.core_details.rarity },
        visuals: { imageUrl: char.visual_details.imageUrl },
    })) as any;
}


export async function followUser(targetUid: string): Promise<ActionResponse> {
    const sourceUid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    if (sourceUid === targetUid) {
        return { success: false, message: "You cannot follow yourself." };
    }

    // This would need a `follows` table in Supabase: { follower_id, following_id }
    const { error } = await supabase
        .from('follows')
        .insert({ follower_id: sourceUid, following_id: targetUid });

    if (error) {
        console.error('Error following user:', error);
        return { success: false, message: 'Failed to follow user.', error: error.message };
    }

    revalidatePath(`/users/${sourceUid}`);
    revalidatePath(`/users/${targetUid}`);

    return { success: true, message: `Successfully followed user ${targetUid}.` };
}

export async function unfollowUser(targetUid: string): Promise<ActionResponse> {
    const sourceUid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    if (sourceUid === targetUid) {
        return { success: false, message: "You cannot unfollow yourself." };
    }

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', sourceUid)
        .eq('following_id', targetUid);

     if (error) {
        console.error('Error unfollowing user:', error);
        return { success: false, message: 'Failed to unfollow user.', error: error.message };
    }

    revalidatePath(`/users/${sourceUid}`);
    revalidatePath(`/users/${targetUid}`);
    return { success: true, message: `Successfully unfollowed user ${targetUid}.` };
}

export async function getFollowStatus(targetUid: string): Promise<{ isFollowing: boolean }> {
    const supabase = getSupabaseServerClient();
    let sourceUid: string | null = null;
    try {
        sourceUid = await verifyAndGetUid();
    } catch {
        return { isFollowing: false };
    }

    if (!sourceUid || sourceUid === targetUid) {
        return { isFollowing: false };
    }
    
    const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', sourceUid)
        .eq('following_id', targetUid)
        .maybeSingle();

    if (error) {
        console.error('Error getting follow status:', error);
        return { isFollowing: false };
    }

    return { isFollowing: !!data };
}

export async function getPublicUserProfile(uid: string): Promise<UserProfile | null> {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            display_name,
            photo_url,
            profile,
            created_at
        `)
        .eq('id', uid)
        .maybeSingle();
        
    if (error) {
        console.error('Error getting public user profile:', error);
        return null;
    }
    
    if (!data) {
        return null;
    }
    
    // Transform the data to match UserProfile type
    return {
        uid: data.id,
        displayName: data.display_name,
        photoURL: data.photo_url,
        bio: data.profile?.bio,
        socialLinks: data.profile?.socialLinks,
        createdAt: data.created_at,
        stats: {
            followers: 0, // These would need to be calculated from follows table
            following: 0,
            charactersCreated: 0,
            totalLikes: 0
        }
    };
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase
        .from('users')
        .update({ preferences: preferences })
        .eq('id', uid);
        
    if (error) {
        console.error('Error updating user preferences:', error);
        return { success: false, message: 'Failed to update preferences.', error: error.message };
    }
    
    revalidatePath('/profile');
    return { success: true, message: 'Preferences updated successfully.' };
}

// DANGER: This is a destructive operation. In a real Supabase setup, you'd call a custom database function.
// This is a simplified version for the purpose of migration.
export async function deleteUserAccount(): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();

    // In Supabase, you would typically create an `rpc` function to handle this securely.
    // This is a placeholder for that logic.
    const { error } = await supabase.rpc('delete_user_account');

    if (error) {
        console.error('Error deleting user account:', error);
        return { success: false, message: 'Failed to delete account.', error: error.message };
    }

    revalidatePath('/');
    return { success: true, message: 'Account deleted successfully.' };
}
