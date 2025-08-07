
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { DataPack } from '@/types/datapack';
import type { Character } from '@/types/character';
import { verifyAndGetUid } from '@/lib/auth/server';

/**
 * Fetches all public datapacks directly from Firestore.
 * This is now the single source of truth for fetching DataPack lists.
 * @returns {Promise<DataPack[]>} A promise that resolves to an array of datapack objects.
 */
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
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
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
        .where('dataPackId', '==', packId)
        .where('isSharedToDataPack', '==', true) // Correctly filters by the specific sharing flag
        .orderBy('createdAt', 'desc')
        .limit(20);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        let userName = 'Anonymous';

        if (data.userId) {
            try {
                if (!adminDb) throw new Error('Database service is unavailable.');
                const userDoc = await adminDb.collection('users').doc(data.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch user ${data.userId} for character ${doc.id}:`, userError);
            }
        }
        
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
        } as Character;
    }));
    
    return charactersData;

  } catch (error) {
    console.error(`Error fetching creations for DataPack ${packId}:`, error);
    return [];
  }
}
