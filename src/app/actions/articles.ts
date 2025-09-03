
'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Article, UpsertArticle } from '@/types/article';
import { UpsertArticleSchema } from '@/types/article';
import { getUserProfile } from './user';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    articleId?: string;
};

// Function to convert a Supabase row to an Article object
const toArticleObject = (row: any): Article => {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        author: row.author_name,
        content: row.content,
        excerpt: row.excerpt,
        status: row.status,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        userId: row.user_id,
    };
};

export async function upsertArticle(data: UpsertArticle): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const user = await getUserProfile(uid);

    const validation = UpsertArticleSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };

    const { id, content, ...rest } = validation.data;
    const excerpt = content.substring(0, 150) + (content.length > 150 ? '...' : '');

    try {
        if (id) {
            const { data: existing, error: fetchError } = await supabase.from('articles').select('user_id').eq('id', id).single();
            if (fetchError || !existing || existing.user_id !== uid) {
                return { success: false, message: 'Permission denied.' };
            }
        }
        
        const dataToUpsert = {
            id: id,
            ...rest,
            content,
            excerpt,
            author_name: user?.displayName || 'Anonymous',
            user_id: uid,
            updated_at: new Date().toISOString(),
        };

        const { data: upsertedData, error } = await supabase.from('articles').upsert(dataToUpsert).select().single();
        if (error) throw error;
        
        revalidatePath('/admin/articles');
        revalidatePath('/profile/articles');
        revalidatePath(`/articles`);
        revalidatePath(`/articles/${upsertedData.slug}`);

        return { success: true, message: 'Article saved successfully.', articleId: upsertedData.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}

export async function deleteArticle(id: string): Promise<ActionResponse> {
    const uid = await verifyAndGetUid();
    const supabase = await getSupabaseServerClient();
    if (!supabase) return { success: false, message: 'Database service is not available.' };
    try {
        const { data: existing, error: fetchError } = await supabase.from('articles').select('user_id').eq('id', id).single();
        if (fetchError || !existing || existing.user_id !== uid) {
             return { success: false, message: 'Permission denied.' };
        }
        
        const { error } = await supabase.from('articles').delete().eq('id', id);
        if(error) throw error;

        revalidatePath('/admin/articles');
        revalidatePath('/profile/articles');
        revalidatePath('/articles');
        return { success: true, message: 'Article deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Failed to delete article.', error: message };
    }
}

export async function getArticlesForUser(userId: string): Promise<Article[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if(error) { console.error("Error fetching user articles", error); return [] };
    return data.map(toArticleObject);
}

export async function getArticle(id: string): Promise<Article | null> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
    if(error || !data) return null;
    return toArticleObject(data);
}

export async function getPublishedArticles(): Promise<Article[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (error) { console.error("Error fetching published articles", error); return [] };
    return data.map(toArticleObject);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) {
        return null;
    }
    return toArticleObject(data);
}

export async function getAllArticlesForAdmin(): Promise<Article[]> {
    const supabase = await getSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Error fetching all articles for admin", error); return [] };
    return data.map(toArticleObject);
}
