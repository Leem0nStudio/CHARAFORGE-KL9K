
'use server';

import { z } from 'zod';
import { verifyAndGetUid } from '@/lib/auth/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserProfile } from './user';
import { PostgrestError } from '@supabase/supabase-js';

export interface Comment {
    id: string;
    entity_type: 'character' | 'datapack' | 'article';
    entity_id: string;
    user_id: string;
    user_name: string;
    user_photo_url?: string;
    content: string;
    created_at: number; // Storing as number (milliseconds) for client-side compatibility
    updated_at: number;
}

const AddCommentSchema = z.object({
    entityType: z.union([z.literal('character'), z.literal('datapack'), z.literal('article')]),
    entityId: z.string().min(1, "Entity ID is required."),
    content: z.string().min(1, "Comment cannot be empty.").max(500, "Comment cannot exceed 500 characters."),
});

// The action now returns the created comment on success.
type ActionResponse = {
    success: boolean;
    message: string;
    comment?: Comment;
    error?: string;
};

export async function addComment(commentData: z.infer<typeof AddCommentSchema>): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };

    const validation = AddCommentSchema.safeParse(commentData);
    if (!validation.success) {
        return { success: false, message: 'Invalid comment data.', error: validation.error.message };
    }

    try {
        const userProfile = await getUserProfile(uid);
        if(!userProfile) throw new Error("Could not find user profile to post comment.");

        const newCommentData = {
            entity_type: validation.data.entityType,
            entity_id: validation.data.entityId,
            user_id: uid,
            user_name: userProfile.displayName || 'Anonymous',
            user_photo_url: userProfile.photoURL || undefined,
            content: validation.data.content,
        };
        
        const { data, error } = await supabase.from('comments').insert(newCommentData).select().single();
        if (error) throw error;
        
        revalidatePath(`/${validation.data.entityType}s/${validation.data.entityId}`);
        
        return { 
            success: true, 
            message: 'Comment added successfully.',
            comment: {
                ...data,
                created_at: new Date(data.created_at).getTime(),
                updated_at: new Date(data.updated_at).getTime(),
            } as unknown as Comment,
        };

    } catch (error: unknown) {
        console.error('Error adding comment:', error);
        return { success: false, message: 'Failed to add comment.', error: (error as Error).message };
    }
}

export async function getComments(entityType: 'character' | 'datapack' | 'article', entityId: string): Promise<Comment[]> {
    const supabase = getSupabaseServerClient();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase.from('comments')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: true })
            .limit(50);
            
        if (error) throw error;

        return data.map(row => ({
            ...row,
            created_at: new Date(row.created_at).getTime(),
            updated_at: new Date(row.updated_at).getTime(),
        })) as unknown as Comment[];

    } catch (error: unknown) {
        console.error('Error fetching comments:', error);
        return [];
    }
}
