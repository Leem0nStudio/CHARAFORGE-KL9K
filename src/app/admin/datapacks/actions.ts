
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
        
        let schema: DataPackSchema;
        try {
            schema = JSON.parse(data.schema);
        } catch (e) {
            return { success: false, message: 'Invalid schema format. Please provide valid JSON.' };
        }

        let coverImageUrl: string | null = null;
        if (coverImage) {
            coverImageUrl = await uploadFileToStorage(packId, 'cover.png', coverImage, 'image/png');
        }

        for (const [fileName, content] of Object.entries(data.options)) {
            await uploadFileToStorage(packId, `options/${fileName}`, content, 'text/plain');
        }

        const schemaUrl = await uploadFileToStorage(packId, 'schema.json', data.schema, 'application/json');

        const docData = {
            name: data.name,
            author: data.author,
            description: data.description,
            type: data.type,
            price: Number(data.price),
            tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            schemaUrl,
            ... (coverImageUrl && { coverImageUrl }), // Conditionally add cover image
            updatedAt: FieldValue.serverTimestamp(),
        };

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

export async function getDataPack(packId: string): Promise<{pack: DataPack, schema: string, options: Record<string, string>} | null> {
    if (!adminDb) return null;
    const doc = await adminDb.collection('datapacks').doc(packId).get();
    if (!doc.exists) return null;

    const pack = { ...doc.data(), id: doc.id, createdAt: doc.data()?.createdAt.toDate() } as DataPack;

    let schema = '';
    let options: Record<string, string> = {};

    try {
        const schemaResponse = await fetch(pack.schemaUrl);
        schema = await schemaResponse.text();

        const schemaJson: DataPackSchema = JSON.parse(schema);
        const optionFiles = schemaJson.fields
            .filter(f => f.type === 'select' && f.optionsSource)
            .map(f => f.optionsSource!);
            
        const bucket = getStorage().bucket();
        for (const fileName of optionFiles) {
            const file = bucket.file(`datapacks/${packId}/options/${fileName}`);
            const [content] = await file.download();
            options[fileName] = content.toString();
        }

    } catch (error) {
        console.error("Failed to fetch DataPack files from storage:", error);
    }
    
    return { pack, schema, options };
}
