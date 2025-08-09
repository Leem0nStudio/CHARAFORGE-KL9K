
'use server';

import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';

/**
 * Fetches public characters and ensures their image URLs are directly accessible.
 * Public images in Firebase Storage should have a simple, public URL.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects.
 */
export async function getPublicCharacters(): Promise<Character[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }
  try {
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
        let originalAuthorName = data.originalAuthorName || null;

        // Fetch current owner's name
        if (data.userId) {
            try {
                if (!adminDb) throw new Error('Database service is unavailable during user fetch.');
                const userDoc = await adminDb.collection('users').doc(data.userId).get();
                if (userDoc.exists) {
                    userName = userDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch user ${data.userId} for character ${doc.id}:`, userError);
            }
        }
        
        // If originalAuthorName is not set directly, fetch it if needed.
        // This handles cases where a character was branched before the name field was added.
        if (!originalAuthorName && data.originalAuthorId) {
             try {
                if (!adminDb) throw new Error('Database service is unavailable during user fetch.');
                const originalAuthorDoc = await adminDb.collection('users').doc(data.originalAuthorId).get();
                if (originalAuthorDoc.exists) {
                    originalAuthorName = originalAuthorDoc.data()?.displayName || 'Anonymous';
                }
            } catch (userError) {
                console.error(`Failed to fetch original author ${data.originalAuthorId} for character ${doc.id}:`, userError);
            }
        }


        charactersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            userName: userName,
            originalAuthorName: originalAuthorName,
        } as Character);
    }
    
    return charactersData;

  } catch (error) {
    console.error("Error fetching public characters:", error);
    return [];
  }
}


/**
 * Fetches the top 4 creators based on the number of characters they have created.
 * @returns {Promise<UserProfile[]>} A promise that resolves to an array of user profile objects.
 */
export async function getTopCreators(): Promise<UserProfile[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    const usersRef = adminDb.collection('users');
    const q = usersRef
      .orderBy('stats.charactersCreated', 'desc')
      .limit(4);
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }
    
    // Map to a clean, serializable object with only the necessary fields
    const creators = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            stats: {
                charactersCreated: data.stats?.charactersCreated || 0,
                totalLikes: data.stats?.totalLikes || 0,
            },
        } as Partial<UserProfile>;
    }) as UserProfile[];

    return creators;

  } catch (error) {
    console.error("Error fetching top creators:", error);
    return [];
  }
}
