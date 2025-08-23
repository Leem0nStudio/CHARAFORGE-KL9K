
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Article, UpsertArticle } from '@/types/article';
import { UpsertArticleSchema } from '@/types/article';
import { verifyAndGetUid } from '@/lib/auth/server';

type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    articleId?: string;
};

// Function to convert Firestore doc to Article object
const toArticleObject = (doc: FirebaseFirestore.DocumentSnapshot): Article => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toMillis(),
        updatedAt: (data.updatedAt as Timestamp).toMillis(),
    } as Article;
};

export async function upsertArticle(data: UpsertArticle): Promise<ActionResponse> {
    await verifyAndGetUid();

    const validation = UpsertArticleSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, message: 'Invalid data provided.', error: validation.error.message };
    }

    const { id, content, ...rest } = validation.data;
    const excerpt = content.substring(0, 150) + (content.length > 150 ? '...' : '');

    try {
        const docRef = id ? adminDb.collection('articles').doc(id) : adminDb.collection('articles').doc();
        
        const docData = {
            ...rest,
            content,
            excerpt,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (id) {
            await docRef.update(docData);
        } else {
            await docRef.set({ ...docData, createdAt: FieldValue.serverTimestamp() });
        }

        revalidatePath('/admin/articles');
        revalidatePath(`/articles`);
        revalidatePath(`/articles/${docData.slug}`);

        return { success: true, message: 'Article saved successfully.', articleId: docRef.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Operation failed.', error: message };
    }
}

export async function deleteArticle(id: string): Promise<ActionResponse> {
    await verifyAndGetUid();
    try {
        await adminDb.collection('articles').doc(id).delete();
        revalidatePath('/admin/articles');
        revalidatePath('/articles');
        return { success: true, message: 'Article deleted successfully.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: 'Failed to delete article.', error: message };
    }
}

export async function getArticles(): Promise<Article[]> {
    const snapshot = await adminDb.collection('articles').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(toArticleObject);
}

export async function getArticle(id: string): Promise<Article | null> {
    const doc = await adminDb.collection('articles').doc(id).get();
    return doc.exists ? toArticleObject(doc) : null;
}

export async function getPublishedArticles(): Promise<Article[]> {
    // Fetch all articles first, then filter and sort on the server.
    // This avoids the need for a composite index in Firestore for this specific query.
    const snapshot = await adminDb.collection('articles').get();
    const articles = snapshot.docs.map(toArticleObject);
    
    return articles
        .filter(article => article.status === 'published')
        .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const snapshot = await adminDb.collection('articles')
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }
    return toArticleObject(snapshot.docs[0]);
}
