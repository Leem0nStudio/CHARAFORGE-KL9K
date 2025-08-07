
'use server';

import { adminDb } from '@/lib/firebase/server';
import { getStorage } from 'firebase-admin/storage';
import type { Character } from '@/types/character';

/**
 * Fetches public characters and ensures their image URLs are directly accessible.
 * Public images in Firebase Storage should have a simple, public URL.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects.
 */
export async function getPublicCharacters(): Promise<Character[]> {
  try {
    if (!adminDb) {
      throw new Error('Database service is unavailable.');
    }
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('status', '==', 'public').orderBy('createdAt', 'desc').limit(20);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData: Character[] = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();
        let userName = 'Anonymous';

        if (data.userId) {
            try {
                const userDoc = await adminDb.collection('users').doc(data.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch user ${data.userId} for character ${doc.id}:`, userError);
            }
        }
        
        // The imageUrl from Firestore for public characters should already be a publicly accessible URL.
        // No need to generate signed URLs for public content.
        charactersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
        } as Character);
    }
    
    return charactersData;

  } catch (error) {
    console.error("Error fetching public characters:", error);
    return [];
  }
}
