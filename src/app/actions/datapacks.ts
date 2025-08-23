

'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue, Timestamp, FieldPath } from 'firebase-admin/firestore';
import type { DataPack, UpsertDataPack } from '@/types/datapack';
import { UpsertDataPackSchema } from '@/types/datapack';
import type { Character } from '@/types/character';
import { verifyAndGetUid } from '@/lib/auth/server';
import { uploadToStorage } from '@/services/storage';

export type ActionResponse = {
    success: boolean;
    message: string;
    error?: string;
    packId?: string;
};

export async function upsertDataPack(data: UpsertDataPack, coverImage?: Buffer): Promise<ActionResponse> {
    try {
        // Pattern: Secure Session Management
        await verifyAndGetUid(); 
        
        if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }
        
        // Pattern: Rigorous Server-Side Validation
        const validation = UpsertDataPackSchema.safeParse(data);
        if (!validation.success) {
            const firstError = validation.error.errors[0];
            const errorMessage = `Invalid input for ${firstError.path.join('.')}: ${firstError.message}`;
            console.error("DataPack Validation Error:", errorMessage);
            return { success: false, message: 'Validation failed.', error: errorMessage };
        }
        const validatedData = validation.data;

        const packId = validatedData.id || adminDb.collection('datapacks').doc().id;
        
        let coverImageUrl: string | null = null;
        if (validatedData.id) {
            const existingDoc = await adminDb.collection('datapacks').doc(validatedData.id).get();
            if (existingDoc.exists) {
                coverImageUrl = existingDoc.data()?.coverImageUrl || null;
            }
        }

        if (coverImage) {
            const destinationPath = `datapacks/${packId}/cover.png`;
            // Pattern: Centralized File Upload Service
            coverImageUrl = await uploadToStorage(coverImage, destinationPath, 'image/png');
        }
        
        const docData = {
            name: validatedData.name,
            author: validatedData.author,
            description: validatedData.description,
            type: validatedData.type,
            price: Number(validatedData.price),
            tags: validatedData.tags || [],
            schema: validatedData.schema,
            isNsfw: validatedData.isNsfw || false,
            updatedAt: FieldValue.serverTimestamp(),
            coverImageUrl: coverImageUrl,
        };
        
        const docRef = adminDb.collection('datapacks').doc(packId);

        if (validatedData.id) {
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
        return { 
            success: true, 
            message: `DataPack "${validatedData.name}" ${validatedData.id ? 'updated' : 'created'} successfully!`,
            packId: packId
        };

    } catch(error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Upsert DataPack Error:", message);
        return { success: false, message: 'Operation failed.', error: message };
    }
}


export async function deleteDataPack(packId: string): Promise<ActionResponse> {
     try {
        // Pattern: Secure Session Management
        await verifyAndGetUid();
         if (!adminDb) {
            throw new Error('Database service is unavailable.');
        }

        await adminDb.collection('datapacks').doc(packId).delete();

        if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
            throw new Error("Firebase Storage bucket is not configured.");
        }
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


export async function getDataPacksForAdmin(): Promise<DataPack[]> {
    if (!adminDb) return [];
    const snapshot = await adminDb.collection('datapacks').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;
        return {
            ...data,
            id: doc.id,
            createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
        } as DataPack;
    });
}

export async function getDataPackForAdmin(packId: string): Promise<DataPack | null> {
    if (!adminDb) return null;
    const docRef = adminDb.collection('datapacks').doc(packId);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    const data = doc.data() as any;
    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;

    return {
        ...data,
        id: doc.id,
        createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
    } as DataPack;
}

export async function getPublicDataPack(packId: string): Promise<DataPack | null> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return null;
    }
    try {
        const docRef = adminDb.collection('datapacks').doc(packId);
        const doc = await docRef.get();
        if (!doc.exists) return null;

        const data = doc.data();
        const createdAt = data?.createdAt;
        const updatedAt = data?.updatedAt;

        return {
            id: doc.id,
            ...data,
            createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
        } as DataPack;

    } catch (error) {
        console.error("Error fetching single public datapack:", error);
        return null;
    }
}


export async function getPublicDataPacks(): Promise<DataPack[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }

  try {
    const dataPacksRef = adminDb.collection('datapacks');
    const snapshot = await dataPacksRef.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return [];
    }

    const dataPacksData = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;
        return {
            id: doc.id,
            ...data,
            createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
        } as DataPack;
    });

    return dataPacksData;

  } catch (error) {
    console.error("Error fetching public datapacks:", error);
    return [];
  }
}

export async function installDataPack(packId: string): Promise<{success: boolean, message: string}> {
    try {
        // Pattern: Secure Session Management
        const uid = await verifyAndGetUid();
        if (!adminDb) throw new Error("Database service is not available.");

        const packRef = adminDb.collection('datapacks').doc(packId);
        const userRef = adminDb.collection('users').doc(uid);

        const [packDoc, userDoc] = await Promise.all([packRef.get(), userRef.get()]);

        if (!packDoc.exists) {
            return { success: false, message: "This DataPack does not exist." };
        }
        
        const packData = packDoc.data() as DataPack;
        if (packData.type !== 'free') {
             return { success: false, message: "This DataPack is not free." };
        }

        const userData = userDoc.data();
        if (userData?.stats?.installedPacks?.includes(packId)) {
            return { success: false, message: "You have already installed this DataPack." };
        }
        
        await userRef.set({
            stats: { 
                installedPacks: FieldValue.arrayUnion(packId)
            }
        }, { merge: true });

        revalidatePath('/profile');
        revalidatePath('/datapacks');
        revalidatePath(`/datapacks/${packId}`);


        return { success: true, message: `Successfully installed "${packData.name}"!` };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Install DataPack Error:", message);
        return { success: false, message: "Failed to install DataPack." };
    }
}

export async function getCreationsForDataPack(packId: string): Promise<Character[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }
  
  try {
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef
        .where('meta.dataPackId', '==', packId)
        .where('settings.isSharedToDataPack', '==', true) 
        .orderBy('meta.createdAt', 'desc')
        .limit(20);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data() as Character;
        let userName = 'Anonymous';

        if (data.meta.userId) {
            try {
                if (!adminDb) throw new Error('Database service is unavailable.');
                const userDoc = await adminDb.collection('users').doc(data.meta.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch user ${data.meta.userId} for character ${doc.id}:`, userError);
            }
        }
        
        const createdAt = data.meta.createdAt as any;
        return {
            ...data,
            id: doc.id,
            meta: {
              ...data.meta,
              createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
              userName: userName,
            }
        } as Character;
    }));
    
    return charactersData;

  } catch (error) {
    console.error(`Error fetching creations for DataPack ${packId}:`, error);
    return [];
  }
}

export async function getInstalledDataPacks(): Promise<DataPack[]> {
    if (!adminDb) {
        throw new Error('Database service not available.');
    }

    let uid: string;
    try {
        uid = await verifyAndGetUid();
    } catch (error) {
        // User is not logged in, return an empty array as they have no installed packs.
        return [];
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    const installedPackIds = userDoc.data()?.stats?.installedPacks || [];
    
    if (installedPackIds.length === 0) {
        return [];
    }

    try {
        const packsRef = adminDb.collection('datapacks');
        const packsSnapshot = await packsRef.where(FieldPath.documentId(), 'in', installedPackIds).get();

        if (packsSnapshot.empty) {
            return [];
        }

        const allPacks = packsSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            const updatedAt = data.updatedAt;
            return {
                ...data,
                id: doc.id,
                createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
                updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
            } as DataPack;
        });
        
        return allPacks;

    } catch (dbError) {
        console.error("Error fetching DataPacks from Firestore:", dbError);
        return [];
    }
}


/**
 * Searches for public datapacks that contain a specific tag in their 'tags' array.
 * @param {string} tag The tag to search for.
 * @returns {Promise<DataPack[]>} A promise resolving to an array of matching datapacks.
 */
export async function searchDataPacksByTag(tag: string): Promise<DataPack[]> {
    if (!adminDb || !tag) {
        return [];
    }

    try {
        const dataPacksRef = adminDb.collection('datapacks');
        const q = dataPacksRef
            .where('tags', 'array-contains', tag.toLowerCase())
            .orderBy('createdAt', 'desc')
            .limit(20);
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            const updatedAt = data.updatedAt;
            return {
                id: doc.id,
                ...data,
                createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : new Date(createdAt).getTime(),
                updatedAt: updatedAt instanceof Timestamp ? updatedAt.toMillis() : (updatedAt ? new Date(updatedAt).getTime() : null),
            } as DataPack;
        });

    } catch (error) {
        console.error(`Error searching for datapacks with tag "${tag}":`, error);
        return [];
    }
}
