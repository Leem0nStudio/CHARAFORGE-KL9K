
'use server';

import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { Timestamp } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types/user';

export async function getCharacters(): Promise<Character[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    const uid = await verifyAndGetUid();
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('userId', '==', uid).orderBy('createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    const charactersData = snapshot.docs.map(doc => {
      const data = doc.data();
      const versions = data.versions || [{ id: doc.id, name: data.versionName || 'v.1', version: data.version || 1 }];
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
        version: data.version || 1,
        versionName: data.versionName || `v.${data.version || 1}`,
        baseCharacterId: data.baseCharacterId || null,
        versions: versions,
        branchingPermissions: data.branchingPermissions || 'private',
        alignment: data.alignment || 'True Neutral',
        tags: data.tags || [],
      } as Character;
    });

    return charactersData;

  } catch (error) {
    if (error instanceof Error && (error.message.includes('User session not found') || error.message.includes('Invalid or expired'))) {
        console.log('User session not found, returning empty character list.');
        return [];
    }
    console.error("Error fetching characters:", error);
    return [];
  }
}

export async function getCharacter(characterId: string): Promise<Character | null> {
    if (!adminDb) {
        console.error('Database service is unavailable.');
        return null;
    }
    try {
        const characterRef = adminDb.collection('characters').doc(characterId);
        const characterDoc = await characterRef.get();

        if (!characterDoc.exists) {
            return null;
        }

        const data = characterDoc.data() as Character;
        
        const [userProfile, dataPack] = await Promise.all([
            data.userId ? adminDb.collection('users').doc(data.userId).get() : Promise.resolve(null),
            data.dataPackId ? adminDb.collection('datapacks').doc(data.dataPackId).get() : Promise.resolve(null)
        ]);

        const userName = userProfile?.data()?.displayName || 'Anonymous';
        const dataPackName = dataPack?.data()?.name || null;
        const originalAuthorName = data.originalAuthorId 
            ? (await adminDb.collection('users').doc(data.originalAuthorId).get())?.data()?.displayName || 'Anonymous' 
            : null;
        
        const createdAt = data.createdAt as any;

        return {
            id: characterDoc.id,
            ...data,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt),
            userName,
            dataPackName,
            originalAuthorName,
        } as Character;

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}
