
'use server';

import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore';

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

    // Collect all user and datapack IDs to fetch them in batches
    const userIds = new Set<string>();
    const dataPackIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) userIds.add(data.userId);
      if (data.originalAuthorId) userIds.add(data.originalAuthorId);
      if (data.dataPackId) dataPackIds.add(data.dataPackId);
    });

    const [userProfiles, dataPacks] = await Promise.all([
      fetchProfilesInBatches(Array.from(userIds)),
      fetchDataPacksInBatches(Array.from(dataPackIds))
    ]);

    const charactersData: Character[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const userName = userProfiles.get(data.userId)?.displayName || 'Anonymous';
      const originalAuthorName = userProfiles.get(data.originalAuthorId)?.displayName || data.originalAuthorName || null;
      const dataPackName = data.dataPackId ? dataPacks.get(data.dataPackId)?.name || null : null;
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        userName,
        originalAuthorName,
        dataPackName,
      } as Character;
    });
    
    return charactersData;

  } catch (error) {
    console.error("Error fetching public characters:", error);
    return [];
  }
}

/**
 * Searches for public characters that contain a specific tag in their 'tags' array.
 * @param {string} tag The tag to search for.
 * @returns {Promise<Character[]>} A promise resolving to an array of matching characters.
 */
export async function searchCharactersByTag(tag: string): Promise<Character[]> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return [];
    }
    if (!tag) {
        return [];
    }

    try {
        const charactersRef = adminDb.collection('characters');
        const q = charactersRef
            .where('status', '==', 'public')
            .where('tags', 'array-contains', tag.toLowerCase())
            .orderBy('createdAt', 'desc')
            .limit(50); // Limit to 50 results for performance
        
        const snapshot = await q.get();

        if (snapshot.empty) {
            return [];
        }
        
        const userIds = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.userId) userIds.add(data.userId);
            if (data.originalAuthorId) userIds.add(data.originalAuthorId);
        });

        const userProfiles = await fetchProfilesInBatches(Array.from(userIds));

        return snapshot.docs.map(doc => {
            const data = doc.data();
            const userName = userProfiles.get(data.userId)?.displayName || 'Anonymous';
            const originalAuthorName = userProfiles.get(data.originalAuthorId)?.displayName || data.originalAuthorName || null;
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
                userName,
                originalAuthorName,
            } as Character;
        });

    } catch (error) {
        console.error(`Error searching for tag "${tag}":`, error);
        return [];
    }
}


/**
 * Fetches the top 4 creators based on the number of characters they have created
 * and who have set their profile to public.
 * @returns {Promise<UserProfile[]>} A promise that resolves to an array of user profile objects.
 */
export async function getTopCreators(): Promise<UserProfile[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    const usersRef = adminDb.collection('users');
    // Only fetch users who have explicitly set their profile to public
    const q = usersRef
      .where('preferences.privacy.profileVisibility', '==', 'public')
      .orderBy('stats.charactersCreated', 'desc')
      .limit(4);
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }
    
    // Map to a clean, serializable object with only the necessary fields
    const creators = snapshot.docs.map(doc => {
        const data = doc.data();
        // **CRITICAL FIX**: Ensure stats.memberSince is serialized
        const stats = data.stats ? {
            ...data.stats,
            memberSince: data.stats.memberSince instanceof Timestamp 
                ? data.stats.memberSince.toMillis() 
                : data.stats.memberSince,
        } : {};

        return {
            uid: doc.id,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            stats,
        } as Partial<UserProfile>;
    }) as UserProfile[];

    return creators;

  } catch (error) {
    console.error("Error fetching top creators:", error);
    return [];
  }
}

/**
 * Fetches all public characters for a specific user.
 * @param {string} userId - The UID of the user whose characters to fetch.
 * @returns {Promise<Character[]>} A promise that resolves to an array of character objects.
 */
export async function getPublicCharactersForUser(userId: string): Promise<Character[]> {
  if (!adminDb) {
    console.error('Database service is unavailable.');
    return [];
  }
  try {
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef
      .where('userId', '==', userId)
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(50);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Character;
    });

  } catch (error) {
    console.error(`Error fetching public characters for user ${userId}:`, error);
    return [];
  }
}


// Helper to fetch documents in batches of 10 for 'in' queries
async function fetchProfilesInBatches(uids: string[]): Promise<Map<string, UserProfile>> {
  if (!adminDb || uids.length === 0) return new Map();
  const profiles = new Map<string, UserProfile>();
  const userRef = adminDb.collection('users');

  // Firestore 'in' queries are limited to 30 items in a single query.
  // We'll use 10 for safety and to avoid large requests.
  for (let i = 0; i < uids.length; i += 10) {
    const batchUids = uids.slice(i, i + 10);
    if (batchUids.length > 0) {
      const snapshot = await userRef.where(FieldPath.documentId(), 'in', batchUids).get();
      snapshot.forEach(doc => profiles.set(doc.id, doc.data() as UserProfile));
    }
  }
  return profiles;
}

async function fetchDataPacksInBatches(packIds: string[]): Promise<Map<string, {name: string}>> {
    if (!adminDb || packIds.length === 0) return new Map();
    const packs = new Map<string, {name: string}>();
    const packRef = adminDb.collection('datapacks');

    for (let i = 0; i < packIds.length; i += 10) {
        const batch = packIds.slice(i, i + 10);
        if (batch.length > 0) {
            const snapshot = await packRef.where(FieldPath.documentId(), 'in', batch).get();
            snapshot.forEach(doc => packs.set(doc.id, { name: doc.data().name }));
        }
    }
    return packs;
}
