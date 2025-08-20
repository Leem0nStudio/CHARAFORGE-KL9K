

'use server';

import { adminDb } from '@/lib/firebase/server';
import { verifyAndGetUid } from '@/lib/auth/server';
import type { Character } from '@/types/character';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';

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

export async function getCharacters(): Promise<Character[]> {
  if (!adminDb) {
      console.error('Database service is unavailable.');
      return [];
  }
  try {
    const uid = await verifyAndGetUid();
    
    const charactersRef = adminDb.collection('characters');
    const q = charactersRef.where('meta.userId', '==', uid).orderBy('meta.createdAt', 'desc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => toCharacterObject(doc.id, doc.data()));

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

        const data = characterDoc.data()!;
        const character = toCharacterObject(characterDoc.id, data);
        
        const [userProfile, dataPack] = await Promise.all([
            character.meta.userId ? adminDb.collection('users').doc(character.meta.userId).get() : Promise.resolve(null),
            character.meta.dataPackId ? adminDb.collection('datapacks').doc(character.meta.dataPackId).get() : Promise.resolve(null)
        ]);

        const originalAuthorProfile = character.lineage.originalAuthorId 
            ? await adminDb.collection('users').doc(character.lineage.originalAuthorId).get()
            : null;
        
        character.meta.userName = userProfile?.data()?.displayName || 'Anonymous';
        character.meta.dataPackName = dataPack?.data()?.name || null;
        character.lineage.originalAuthorName = originalAuthorProfile?.data()?.displayName || 'Anonymous';
        
        return character;

    } catch (error) {
        console.error(`Error fetching character ${characterId}:`, error);
        return null;
    }
}
