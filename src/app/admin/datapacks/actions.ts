
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { DataPack, UpsertDataPack, DataPackSchema } from '@/types/datapack';
import { verifyAndGetUid } from '@/lib/auth/server';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
};


async function uploadFileToStorage(
    packId: string, 
    fileName: string, 
    content: string | Buffer,
    contentType: string,
): Promise<string> {
    const bucket = getStorage().bucket();
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
        await verifyAndGetUid(); // Ensure user is admin
        
        if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }

        const packId = data.id || adminDb.collection('datapacks').doc().id;
        
        // The schema is now pre-formatted JSON, so we just validate it
        try {
            JSON.parse(data.schema);
        } catch (e) {
            return { success: false, message: 'Invalid schema format. Please provide valid JSON.' };
        }

        let coverImageUrl: string | null = data.id ? (await adminDb.collection('datapacks').doc(data.id).get()).data()?.coverImageUrl : null;

        if (coverImage) {
            coverImageUrl = await uploadFileToStorage(packId, 'cover.png', coverImage, 'image/png');
        }

        const schemaUrl = await uploadFileToStorage(packId, 'schema.json', data.schema, 'application/json');

        const docData: Omit<Partial<DataPack>, 'id' | 'createdAt'> & { updatedAt: FieldValue, tags: string[], schemaUrl: string } = {
            name: data.name,
            author: data.author,
            description: data.description,
            type: data.type,
            price: Number(data.price),
            tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            schemaUrl,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (coverImageUrl) {
            docData.coverImageUrl = coverImageUrl;
        }

        if (data.id) {
            await adminDb.collection('datapacks').doc(packId).update(docData);
        } else {
             await adminDb.collection('datapacks').doc(packId).set({
                ...docData,
                id: packId,
                createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        
        revalidatePath('/admin/datapacks');
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

        // Delete Firestore document
        await adminDb.collection('datapacks').doc(packId).delete();

        // Delete all associated files in Storage
        const bucket = getStorage().bucket();
        await bucket.deleteFiles({ prefix: `datapacks/${packId}/` });
        
        revalidatePath('/admin/datapacks');
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

export async function getDataPack(packId: string): Promise<{pack: DataPack, schema: string} | null> {
    if (!adminDb) return null;
    const doc = await adminDb.collection('datapacks').doc(packId).get();
    if (!doc.exists) return null;

    const pack = { ...doc.data(), id: doc.id, createdAt: doc.data()?.createdAt.toDate() } as DataPack;

    let schema = '';

    try {
        if (pack.schemaUrl) {
            const schemaResponse = await fetch(pack.schemaUrl, { cache: 'no-store' });
            schema = await schemaResponse.text();
        }
    } catch (error) {
        console.error("Failed to fetch DataPack schema from storage:", error);
    }
    
    return { pack, schema };
}

    