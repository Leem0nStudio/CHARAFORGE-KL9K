

'use server';

import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import type { UserProfile } from '@/types/user';
import type { DataPack } from '@/types/datapack';


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
        rarity: data.rarity || 3,
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
     const defaultRpg = {
        isPlayable: data.rpg?.isPlayable ?? !!(data.core?.archetype || data.archetype),
        level: data.rpg?.level || 1,
        experience: data.rpg?.experience || 0,
        skills: data.rpg?.skills || [],
        statsStatus: data.rpg?.statsStatus || 'pending',
        skillsStatus: data.rpg?.skillsStatus || 'pending',
        stats: data.rpg?.stats || {
            strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
        },
    };

    return {
        id: docId,
        core: { ...defaultCore, ...data.core },
        visuals: { ...defaultVisuals, ...data.visuals },
        meta: { ...defaultMeta, ...data.meta, createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : new Date() },
        lineage: { ...defaultLineage, ...data.lineage },
        settings: { ...defaultSettings, ...data.settings },
        generation: { ...defaultGeneration, ...data.generation },
        rpg: { ...defaultRpg, ...data.rpg }
    } as Character;
}

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
