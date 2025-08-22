

'use server';

import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';
import { toCharacterObject } from '@/services/character-hydrator';


export async function getCharacters(): Promise<Character[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      throw new Error('The database service is currently unavailable. Please try again later.');
  }
  
  const uid = await verifyAndGetUid();
  
  try {
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('meta.userId', '==', uid);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }
    
    const characters = snapshot.docs.map(doc => toCharacterObject(doc.id, doc.data()));

    characters.sort((a, b) => b.meta.createdAt.getTime() - a.meta.createdAt.getTime());

    return characters;

  } catch (error) {
    console.error("Error fetching characters:", error);
    throw new Error("Could not fetch characters from the database.");
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

        const character = toCharacterObject(characterDoc.id, characterDoc.data()!);
        
        const [userProfile, dataPack, originalAuthorProfile] = await Promise.all([
            character.meta.userId ? adminDb.collection('users').doc(character.meta.userId).get() : null,
            character.meta.dataPackId ? adminDb.collection('datapacks').doc(character.meta.dataPackId).get() : null,
            character.lineage.originalAuthorId ? adminDb.collection('users').doc(character.lineage.originalAuthorId).get() : null
        ]);
        
        if (userProfile?.exists) {
            character.meta.userName = (userProfile.data() as UserProfile).displayName || 'Anonymous';
        }
        if (dataPack?.exists) {
            character.meta.dataPackName = (dataPack.data() as DataPack).name || null;
        }
        if (originalAuthorProfile?.exists) {
            character.lineage.originalAuthorName = (originalAuthorProfile.data() as UserProfile).displayName || 'Anonymous';
        }
        
        return character;

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}
