
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


// Helper to fetch documents in batches of 10 for 'in' queries
async function fetchProfilesInBatches(uids: string[]): Promise<Map<string, UserProfile>> {
  if (!adminDb || uids.length === 0) return new Map();
  const profiles = new Map<string, UserProfile>();
  const userRef = adminDb.collection('users');

  for (let i = 0; i < uids.length; i += 10) {
    const batch = uids.slice(i, i + 10);
    const snapshot = await userRef.where('uid', 'in', batch).get();
    snapshot.forEach(doc => profiles.set(doc.id, doc.data() as UserProfile));
  }
  return profiles;
}

async function fetchDataPacksInBatches(packIds: string[]): Promise<Map<string, {name: string}>> {
    if (!adminDb || packIds.length === 0) return new Map();
    const packs = new Map<string, {name: string}>();
    const packRef = adminDb.collection('datapacks');

    for (let i = 0; i < packIds.length; i += 10) {
        const batch = packIds.slice(i, i + 10);
        const snapshot = await packRef.where('id', 'in', batch).get();
        snapshot.forEach(doc => packs.set(doc.id, { name: doc.data().name }));
    }
    return packs;
}

    