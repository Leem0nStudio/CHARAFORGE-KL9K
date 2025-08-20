

'use server';

import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import { FieldValue, FieldPath, Timestamp, QuerySnapshot, DocumentData } from 'firebase-admin/firestore';
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
 * Converts a Firestore document data object into a fully-typed, serializable Character object.
 * This helper function ensures consistency across different read operations.
 * @param docId The ID of the document.
 * @param data The document data from Firestore.
 * @returns A Character object.
 */
function toCharacterObject(docId: string, data: DocumentData): Character {
    const createdAt = data.meta?.createdAt;
    
    // Default values for backward compatibility with the old flat structure
    const defaultCore = {
        name: data.name || 'Unnamed',
        biography: data.biography || '',
        physicalDescription: data.physicalDescription || data.description || null,
        alignment: data.alignment || 'True Neutral',
        archetype: data.archetype || null,
        equipment: data.equipment || [],
        timeline: data.timeline || [],
        tags: data.tags || [],
    };
    const defaultVisuals = {
        imageUrl: data.imageUrl || '',
        gallery: data.gallery || [data.imageUrl].filter(Boolean),
    };
    const defaultMeta = {
        userId: data.userId || '',
        status: data.status || 'private',
        isNsfw: data.isNsfw || false,
        dataPackId: data.dataPackId || null,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(),
    };
    const defaultLineage = {
        version: data.version || 1,
        versionName: data.versionName || 'v.1',
        baseCharacterId: data.baseCharacterId || docId,
        versions: data.versions || [{ id: docId, name: 'v.1', version: 1 }],
        branchedFromId: data.branchedFromId || null,
        originalAuthorId: data.originalAuthorId || null,
    };
    const defaultSettings = {
        isSharedToDataPack: data.isSharedToDataPack || false,
        branchingPermissions: data.branchingPermissions || 'private',
    };
    const defaultGeneration = {
        textEngine: data.textEngine,
        imageEngine: data.imageEngine,
        wizardData: data.wizardData,
        originalPrompt: data.originalPrompt || data.description,
    };

    return {
        id: docId,
        core: { ...defaultCore, ...data.core },
        visuals: { ...defaultVisuals, ...data.visuals },
        meta: { ...defaultMeta, ...data.meta, createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date() },
        lineage: { ...defaultLineage, ...data.lineage },
        settings: { ...defaultSettings, ...data.settings },
        generation: { ...defaultGeneration, ...data.generation }
    } as Character;
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

    const characters: Character[] = snapshot.docs.map(doc => toCharacterObject(doc.id, doc.data()));
    
    // 1. Collect all unique IDs needed for hydration
    const userIds = new Set<string>();
    const dataPackIds = new Set<string>();
    characters.forEach(char => {
        if (char.meta.userId) userIds.add(char.meta.userId);
        if (char.lineage.originalAuthorId) userIds.add(char.lineage.originalAuthorId);
        if (char.meta.dataPackId) dataPackIds.add(char.meta.dataPackId);
    });

    // 2. Fetch all related data in parallel batches
    const [userProfiles, dataPacks] = await Promise.all([
        fetchDocsInBatches<UserProfile>(Array.from(userIds), 'users'),
        fetchDocsInBatches<DataPack>(Array.from(dataPackIds), 'datapacks')
    ]);

    // 3. Map characters to their final, hydrated form
    return characters.map(char => {
        return {
            ...char,
            meta: {
                ...char.meta,
                userName: userProfiles.get(char.meta.userId)?.displayName || 'Anonymous',
                dataPackName: char.meta.dataPackId ? dataPacks.get(char.meta.dataPackId)?.name || null : null,
            },
            lineage: {
                ...char.lineage,
                originalAuthorName: char.lineage.originalAuthorId ? userProfiles.get(char.lineage.originalAuthorId)?.displayName || char.lineage.originalAuthorName || null : null,
            }
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
    const q = charactersRef.where('meta.status', '==', 'public').orderBy('meta.createdAt', 'desc').limit(20);
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
            .where('meta.status', '==', 'public')
            .where('core.tags', 'array-contains', tag.toLowerCase())
            .orderBy('meta.createdAt', 'desc')
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
 * This query is now simplified to avoid needing a composite index.
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
    // Simplified query to avoid composite index requirement.
    // We fetch all characters by the user and then filter for public status in the code.
    const q = charactersRef
      .where('meta.userId', '==', userId)
      .orderBy('meta.createdAt', 'desc')
      .limit(100); // Fetch a reasonable limit of total characters
    
    const snapshot = await q.get();
    
    const allUserCharacters = snapshot.docs.map(doc => toCharacterObject(doc.id, doc.data()));

    // Filter for public characters in the application logic.
    return allUserCharacters.filter(char => char.meta.status === 'public');

  } catch (error) {
    console.error(`Error fetching public characters for user ${userId}:`, error);
    return [];
  }
}
