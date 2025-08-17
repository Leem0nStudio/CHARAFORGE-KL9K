
'use server';

import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import { FieldValue, FieldPath, Timestamp, QuerySnapshot } from 'firebase-admin/firestore';
import type { DataPack } from '@/types/datapack';

// Helper to fetch documents in batches of 30 for 'in' queries
async function fetchDocsInBatches<T>(ids: string[], collection: string): Promise<Map<string, T>> {
    if (!adminDb || ids.length === 0) return new Map();
    const results = new Map<string, T>();
    const collectionRef = adminDb.collection(collection);

    // Firestore 'in' queries are limited to 30 items.
    for (let i = 0; i < ids.length; i += 30) {
        const batchIds = ids.slice(i, i + 30);
        if (batchIds.length > 0) {
            const snapshot = await collectionRef.where(FieldPath.documentId(), 'in', batchIds).get();
            snapshot.forEach(doc => results.set(doc.id, doc.data() as T));
        }
    }
    return results;
}

/**
 * Takes a Firestore query snapshot of characters and enriches them with related data.
 * @param snapshot The QuerySnapshot from the 'characters' collection.
 * @returns A promise that resolves to an array of hydrated Character objects.
 */
async function hydrateCharacters(snapshot: QuerySnapshot): Promise<Character[]> {
    if (snapshot.empty) {
        return [];
    }

    const characters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Character));
    
    // 1. Collect all unique IDs needed for hydration
    const userIds = new Set<string>();
    const dataPackIds = new Set<string>();
    characters.forEach(char => {
        if (char.userId) userIds.add(char.userId);
        if (char.originalAuthorId) userIds.add(char.originalAuthorId);
        if (char.dataPackId) dataPackIds.add(char.dataPackId);
    });

    // 2. Fetch all related data in parallel batches
    const [userProfiles, dataPacks] = await Promise.all([
        fetchDocsInBatches<UserProfile>(Array.from(userIds), 'users'),
        fetchDocsInBatches<DataPack>(Array.from(dataPackIds), 'datapacks')
    ]);

    // 3. Map characters to their final, hydrated form
    return characters.map(char => {
        const createdAt = char.createdAt as any;
        return {
            ...char,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
            userName: userProfiles.get(char.userId)?.displayName || 'Anonymous',
            originalAuthorName: userProfiles.get(char.originalAuthorId)?.displayName || char.originalAuthorName || null,
            dataPackName: char.dataPackId ? dataPacks.get(char.dataPackId)?.name || null : null,
        };
    });
}


/**
 * Fetches public characters and ensures their image URLs are directly accessible.
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
    return hydrateCharacters(snapshot);
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
            .limit(50);
        
        const snapshot = await q.get();
        return hydrateCharacters(snapshot);

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
        const memberSince = data.stats?.memberSince;
        
        const stats = data.stats ? {
            ...data.stats,
            memberSince: memberSince instanceof Timestamp ? memberSince.toMillis() : memberSince,
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

    // This page doesn't need the full hydration, so we keep it simple.
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
      } as Character;
    });

  } catch (error) {
    console.error(`Error fetching public characters for user ${userId}:`, error);
    return [];
  }
}
