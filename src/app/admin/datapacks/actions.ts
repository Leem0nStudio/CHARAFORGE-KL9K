
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { DataPack, UpsertDataPack } from '@/types/datapack';
import { verifyAndGetUid } from '@/lib/auth/server';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};


async function uploadFileToStorage(
    packId: string, 
    fileName: string, 
    content: Buffer,
    contentType: string,
): Promise<string> {
    const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `datapacks/${packId}/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(content, { 
        metadata: { contentType },
        public: true 
    });

    return file.publicUrl();
}


export async function upsertDataPack(data: UpsertDataPack, coverImage?: Buffer): Promise<ActionResponse> {
    try {
        await verifyAndGetUid(); 
        
        if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }

        const packId = data.id || adminDb.collection('datapacks').doc().id;
        
        let coverImageUrl: string | null = null;
        if (data.id) {
            const existingDoc = await adminDb.collection('datapacks').doc(data.id).get();
            if (existingDoc.exists) {
                coverImageUrl = existingDoc.data()?.coverImageUrl || null;
            }
        }

        if (coverImage) {
            coverImageUrl = await uploadFileToStorage(packId, 'cover.png', coverImage, 'image/png');
        }

        const docData = {
            name: data.name,
            author: data.author,
            description: data.description,
            type: data.type,
            price: Number(data.price),
            tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            schema: data.schema, // The schema is now an object
            updatedAt: FieldValue.serverTimestamp(),
            coverImageUrl: coverImageUrl,
        };
        
        const docRef = adminDb.collection('datapacks').doc(packId);

        if (data.id) {
            await docRef.update(docData);
        } else {
             await docRef.set({
                ...docData,
                id: packId,
                createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        
        revalidatePath('/admin/datapacks');
        revalidatePath(`/datapacks/${packId}`);
        return { success: true, message: `DataPack "${data.name}" ${data.id ? 'updated' : 'created'} successfully!` };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Upsert DataPack Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteDataPack(packId: string): Promise<ActionResponse> {
     try {
        await verifyAndGetUid();
         if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }

        await adminDb.collection('datapacks').doc(packId).delete();

        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        await bucket.deleteFiles({ prefix: `datapacks/${packId}/` });
        
        revalidatePath('/admin/datapacks');
        revalidatePath('/datapacks');
        return { success: true, message: 'DataPack deleted successfully.' };
    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: 'Failed to delete DataPack.', error: message };
    }
}


export async function getDataPacks(): Promise<DataPack[]> {
    if (!adminDb) return [];
    const snapshot = await adminDb.collection('datapacks').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
        } as DataPack;
    });
}

export async function getDataPack(packId: string): Promise<DataPack | null> {
    if (!adminDb) return null;
    const docRef = adminDb.collection('datapacks').doc(packId);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    const data = doc.data() as any;

    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt.toDate(),
    } as DataPack;
}

    